# Contributing Guide

Thank you for your interest in contributing to this Claude Agent SDK test project!

## How to Contribute

### Adding New Examples

1. **Create a new example file** in `src/examples/`:
   ```bash
   touch src/examples/your-feature.ts
   ```

2. **Follow the example template**:
   ```typescript
   /**
    * Your Feature Example
    * 
    * Brief description of what this example demonstrates.
    */

   import { query } from '@anthropic-ai/claude-agent-sdk';

   async function yourFeatureExample() {
     console.log('=== Your Feature Example ===\n');

     try {
       // Your code here
       const result = query({
         prompt: 'Your prompt',
         options: { /* ... */ }
       });

       for await (const message of result) {
         // Handle messages
       }

       console.log('\n✓ Example completed');
     } catch (error) {
       console.error('Error:', error);
     }
   }

   // Run if this file is executed directly
   if (import.meta.url === `file://${process.argv[1]}`) {
     yourFeatureExample();
   }

   export { yourFeatureExample };
   ```

3. **Add npm script** in `package.json`:
   ```json
   "example:yourfeature": "tsx src/examples/your-feature.ts"
   ```

4. **Update index.ts** to include your example:
   ```typescript
   import { yourFeatureExample } from './examples/your-feature.js';
   
   const examples = {
     // ... existing examples
     yourfeature: { name: 'Your Feature', fn: yourFeatureExample },
   };
   ```

5. **Document in README.md** - Add a section describing your example.

### Improving Documentation

- Fix typos or unclear explanations in README.md
- Add more detailed comments to examples
- Create additional guides (like QUICKSTART.md)

### Code Quality

- Use TypeScript for all code
- Follow the existing code style
- Add JSDoc comments for functions
- Handle errors gracefully
- Test your examples before submitting

### Testing Your Changes

```bash
# Build the project
npm run build

# Test your specific example
npm run example:yourfeature

# Or run it directly
npx tsx src/examples/your-feature.ts
```

## Example Ideas

Here are some examples that would be great additions:

- **Error Recovery** - Handling and recovering from errors
- **Rate Limiting** - Managing API rate limits
- **Caching** - Using prompt caching effectively
- **Multi-modal** - Working with images and PDFs
- **Testing** - Unit testing agent interactions
- **Production Patterns** - Best practices for production use
- **Web Integration** - Using the SDK in web applications
- **CLI Tools** - Building command-line tools
- **Monitoring** - Logging and monitoring agent behavior

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

## Questions?

- Open an issue for questions or suggestions
- Join the [Discord community](https://discord.gg/anthropic)
- Check the [official docs](https://docs.claude.com)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.


