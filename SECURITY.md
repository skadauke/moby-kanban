# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by emailing **kadaukes@chop.edu** rather than opening a public issue.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

## Response Timeline

- **Initial response:** Within 48 hours
- **Status update:** Within 7 days
- **Fix for critical vulnerabilities:** Within 14 days

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Security Best Practices

This project follows these security practices:
- Dependencies scanned for vulnerabilities via `npm audit`
- Secrets managed externally (never committed)
- All user input validated and sanitized
- Authentication required for sensitive operations
