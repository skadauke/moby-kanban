#!/usr/bin/env node

/**
 * AI Code Review Script using GPT-5.2-Codex (Responses API)
 * 
 * Packages the codebase and diff, sends to Codex for review,
 * outputs structured findings for PR comments.
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.AI_REVIEW_MODEL || 'gpt-5.2-codex';
const MAX_FILE_SIZE = 50000;
const MAX_TOTAL_CHARS = 120000;

// File patterns to include
const INCLUDE_PATTERNS = [
  /\.tsx?$/,
  /\.jsx?$/,
  /\.json$/,
  /\.md$/,
  /\.yml$/,
  /\.yaml$/,
];

// Paths to exclude
const EXCLUDE_PATHS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'coverage',
  '.vercel',
  'package-lock.json',
];

function shouldIncludeFile(filePath) {
  for (const exclude of EXCLUDE_PATHS) {
    if (filePath.includes(exclude)) return false;
  }
  return INCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function getAllFiles(dir, baseDir = dir) {
  const files = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relativePath = relative(baseDir, fullPath);
      if (EXCLUDE_PATHS.some(ex => relativePath.startsWith(ex))) continue;
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...getAllFiles(fullPath, baseDir));
      } else if (shouldIncludeFile(relativePath) && stat.size < MAX_FILE_SIZE) {
        files.push({ path: relativePath, size: stat.size });
      }
    }
  } catch (e) {}
  return files;
}

function getFileContents(files, baseDir) {
  let totalChars = 0;
  const contents = [];
  
  files.sort((a, b) => {
    const aIsSrc = a.path.startsWith('src/');
    const bIsSrc = b.path.startsWith('src/');
    if (aIsSrc && !bIsSrc) return -1;
    if (!aIsSrc && bIsSrc) return 1;
    return a.path.localeCompare(b.path);
  });
  
  for (const file of files) {
    if (totalChars >= MAX_TOTAL_CHARS) {
      contents.push(`\n... (truncated, ${files.length - contents.length} more files)`);
      break;
    }
    try {
      const content = readFileSync(join(baseDir, file.path), 'utf-8');
      contents.push(`\n=== ${file.path} ===\n${content}`);
      totalChars += content.length;
    } catch (e) {}
  }
  return contents.join('\n');
}

function getDiff() {
  try {
    const baseBranch = process.env.GITHUB_BASE_REF || 'main';
    return execSync(`git diff origin/${baseBranch}...HEAD`, { encoding: 'utf-8', maxBuffer: 1024 * 1024 });
  } catch (e) {
    try {
      return execSync('git diff HEAD~1', { encoding: 'utf-8', maxBuffer: 1024 * 1024 });
    } catch (e2) {
      return '(Unable to generate diff)';
    }
  }
}

function getPackageJson(baseDir) {
  try {
    return readFileSync(join(baseDir, 'package.json'), 'utf-8');
  } catch (e) {
    return '{}';
  }
}

function getPrChecklist(baseDir) {
  try {
    return readFileSync(join(baseDir, '.github/PULL_REQUEST_TEMPLATE.md'), 'utf-8');
  } catch (e) {
    return '';
  }
}

function getSpec(baseDir) {
  try {
    return readFileSync(join(baseDir, 'SPEC.md'), 'utf-8');
  } catch (e) {
    return '';
  }
}

async function callCodexResponses(context) {
  const prompt = `You are an expert code reviewer doing an in-depth review. Focus on things that automated tools and linters would MISS.

## Your Review Focus

### 1. Logic & Correctness
- **Off-by-one errors** in loops, array indexing, pagination
- **Boundary conditions** and edge cases
- **Race conditions** in async code
- **Null/undefined handling** that could cause runtime errors

### 2. Data Validation
- **Input validation** - are all user inputs validated strictly?
- **Type coercion issues** - implicit conversions that could cause bugs
- **API request/response validation** - are schemas enforced?

### 3. Test Quality
- **Coverage gaps** - target >90% coverage; flag untested code paths
- **Missing edge cases** - empty arrays, null values, boundary values
- **Test assertions** - are tests actually testing the right things?
- **Mocking issues** - are mocks hiding real bugs?

### 4. Spec vs Implementation
- Compare against SPEC.md if present - does implementation match?
- Feature completeness - are all specified features implemented?
- Behavior discrepancies between spec and code

### 5. Documentation & Readability
- **Code clarity** - would a new developer understand this?
- **Comment quality** - do comments explain WHY, not just WHAT?
- **README accuracy** - does it reflect current state?
- **API documentation** - are endpoints/functions documented?

### 6. Security Vulnerabilities
- **Auth/authz gaps** - missing or inconsistent access control
- **Injection risks** - SQL, XSS, command injection
- **Secrets exposure** - hardcoded credentials, logged secrets
- **CSRF/CORS issues** - misconfigured security headers

### 7. Stale/Dead Code
- Files not imported anywhere
- Unused dependencies in package.json
- Outdated documentation referencing removed features
- Commented-out code that should be deleted

### 8. Semantic Versioning
- Does this change warrant a version bump? (patch/minor/major)
- Breaking changes that need documentation?
- CHANGELOG update needed?

## Product Specification (SPEC.md)
${context.spec || '(No SPEC.md found)'}

## PR Checklist (for reference)
${context.prChecklist}

## Package.json
\`\`\`json
${context.packageJson}
\`\`\`

## Git Diff (what changed)
\`\`\`diff
${context.diff.slice(0, 30000)}
\`\`\`

## Codebase
${context.codebase}

---

Review this code. Group findings by severity (🔴 Critical, 🟠 Warning, 🟡 Suggestion).
For each finding: file path, description, suggested fix.
Be specific and actionable. Skip obvious linter-catchable issues.
End with a brief summary and version bump recommendation.`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: prompt,
      reasoning: {
        effort: 'medium',
        summary: 'auto',  // Include reasoning summary in output
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  
  // Extract text from responses API output
  let result = [];
  
  // Include reasoning summary if available
  if (data.output && data.output.length > 0) {
    for (const output of data.output) {
      if (output.type === 'reasoning' && output.summary && output.summary.length > 0) {
        result.push('## 🧠 Reasoning Trace\n');
        result.push(output.summary.map(s => `- ${s.text}`).join('\n'));
        result.push('\n---\n');
      }
      if (output.type === 'message' && output.content) {
        const texts = output.content
          .filter(c => c.type === 'output_text')
          .map(c => c.text || '');
        if (texts.length > 0) {
          result.push(texts.join('\n'));
        }
      }
    }
  }
  
  return result.length > 0 ? result.join('\n') : 'No review output generated.';
}

async function main() {
  if (!OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  const baseDir = process.cwd();
  console.error('🔍 Gathering codebase...');
  
  const files = getAllFiles(baseDir);
  console.error(`   Found ${files.length} files`);
  
  const codebase = getFileContents(files, baseDir);
  console.error(`   Codebase: ${codebase.length} characters`);
  
  const diff = getDiff();
  console.error(`   Diff: ${diff.length} characters`);
  
  const packageJson = getPackageJson(baseDir);
  const prChecklist = getPrChecklist(baseDir);
  const spec = getSpec(baseDir);
  
  console.error(`🤖 Sending to ${MODEL} for review...`);
  
  try {
    const review = await callCodexResponses({ codebase, diff, packageJson, prChecklist, spec });
    console.log(review);
  } catch (error) {
    console.error('Error during review:', error.message);
    process.exit(1);
  }
}

main();
