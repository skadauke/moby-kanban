#!/usr/bin/env node

/**
 * AI Code Review Script
 * 
 * Packages the codebase and diff, sends to OpenAI for review,
 * outputs structured findings for PR comments.
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.AI_REVIEW_MODEL || 'o3-mini';
const MAX_FILE_SIZE = 50000; // Skip files larger than 50KB
const MAX_TOTAL_CHARS = 100000; // Limit total context

// File patterns to include
const INCLUDE_PATTERNS = [
  /\.tsx?$/,
  /\.jsx?$/,
  /\.json$/,
  /\.md$/,
  /\.yml$/,
  /\.yaml$/,
  /\.css$/,
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
  // Check exclusions
  for (const exclude of EXCLUDE_PATHS) {
    if (filePath.includes(exclude)) return false;
  }
  // Check inclusions
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
  } catch (e) {
    // Skip unreadable directories
  }
  
  return files;
}

function getFileContents(files, baseDir) {
  let totalChars = 0;
  const contents = [];
  
  // Sort by importance: src/ first, then tests, then config
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
      const header = `\n=== ${file.path} ===\n`;
      contents.push(header + content);
      totalChars += content.length;
    } catch (e) {
      // Skip unreadable files
    }
  }
  
  return contents.join('\n');
}

function getDiff() {
  try {
    // Try to get diff against main branch
    const baseBranch = process.env.GITHUB_BASE_REF || 'main';
    return execSync(`git diff origin/${baseBranch}...HEAD`, { encoding: 'utf-8', maxBuffer: 1024 * 1024 });
  } catch (e) {
    try {
      // Fallback: diff of last commit
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

async function callOpenAI(prompt, context) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert code reviewer. Your job is to review code changes and flag potential issues.

Be thorough but practical. Focus on:
1. **Stale Code**: Files, dependencies, or code that's no longer used
2. **Security**: Hardcoded secrets, missing auth checks, unsafe patterns
3. **Bugs**: Logic errors, null pointer risks, race conditions
4. **Code Quality**: DRY violations, complex functions, unclear naming
5. **Performance**: N+1 queries, missing memoization, unnecessary rerenders
6. **Testing**: Missing test coverage for new functionality
7. **Documentation**: Outdated docs, missing comments for complex logic

Output format:
- Use markdown
- Group findings by severity: 🔴 Critical, 🟠 Warning, 🟡 Suggestion
- For each finding: file path, line (if applicable), description, suggested fix
- At the end, give a brief summary

Be specific and actionable. Don't flag style issues that a linter would catch.`
        },
        {
          role: 'user',
          content: `Review this codebase and the changes made.

## Package.json (dependencies)
\`\`\`json
${context.packageJson}
\`\`\`

## Git Diff (what changed)
\`\`\`diff
${context.diff.slice(0, 30000)}
\`\`\`

## Full Codebase
${context.codebase}

---

Please review and flag any issues.`
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
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
  
  console.error('🤖 Sending to AI for review...');
  
  try {
    const review = await callOpenAI('review', { codebase, diff, packageJson });
    
    // Output review to stdout (for GitHub Actions to capture)
    console.log(review);
    
  } catch (error) {
    console.error('Error during review:', error.message);
    process.exit(1);
  }
}

main();
