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

async function callCodexResponses(context) {
  const prompt = `You are reviewing a codebase for a pull request. Focus on things that automated tools and linters would MISS.

## Your Review Focus (Non-Obvious Issues)

1. **Stale/Dead Code Detection**
   - Files that exist but aren't imported anywhere
   - Dependencies in package.json that aren't used in source
   - Documentation that references outdated tech/patterns
   - Commented-out code blocks that should be removed
   - Configuration for features that no longer exist

2. **Semantic Versioning & Release Readiness**
   - Does this change warrant a version bump? (patch/minor/major)
   - Are there breaking changes that need documentation?
   - Should CHANGELOG be updated?

3. **Required Files & Project Health**
   - Is README.md accurate and up-to-date?
   - Does LICENSE file exist and make sense?
   - Are required config files present?
   - Is .gitignore comprehensive?

4. **Architectural Concerns**
   - Code that works but doesn't match current patterns
   - Inconsistent approaches across similar files
   - Technical debt being introduced

5. **Security (Non-Obvious)**
   - Secrets that might be hardcoded in non-obvious places
   - Auth checks that are missing or inconsistent
   - Data exposure through logs or error messages

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
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  
  // Extract text from responses API output
  // Look for message-type output (skip reasoning)
  if (data.output && data.output.length > 0) {
    for (const output of data.output) {
      if (output.type === 'message' && output.content) {
        const texts = output.content
          .filter(c => c.type === 'output_text')
          .map(c => c.text || '');
        if (texts.length > 0) {
          return texts.join('\n');
        }
      }
    }
  }
  
  return 'No review output generated.';
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
  
  console.error(`🤖 Sending to ${MODEL} for review...`);
  
  try {
    const review = await callCodexResponses({ codebase, diff, packageJson, prChecklist });
    console.log(review);
  } catch (error) {
    console.error('Error during review:', error.message);
    process.exit(1);
  }
}

main();
