/**
 * Custom Tools Example
 * 
 * Demonstrates how to create custom MCP tools using the tool() function
 * and use them with the Agent SDK.
 */

import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

// Create a custom calculator tool
const calculatorTool = tool(
  'calculator',
  'Performs basic arithmetic operations (add, subtract, multiply, divide)',
  {
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('The operation to perform'),
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  },
  async (args) => {
    let result: number;
    
    switch (args.operation) {
      case 'add':
        result = args.a + args.b;
        break;
      case 'subtract':
        result = args.a - args.b;
        break;
      case 'multiply':
        result = args.a * args.b;
        break;
      case 'divide':
        if (args.b === 0) {
          return {
            content: [{ type: 'text', text: 'Error: Division by zero' }],
            isError: true,
          };
        }
        result = args.a / args.b;
        break;
    }

    return {
      content: [{
        type: 'text',
        text: `The result of ${args.a} ${args.operation} ${args.b} is ${result}`,
      }],
    };
  }
);

// Create a weather simulator tool
const weatherTool = tool(
  'get_weather',
  'Get simulated weather information for a city',
  {
    city: z.string().describe('The city name'),
    units: z.enum(['celsius', 'fahrenheit']).optional().describe('Temperature units'),
  },
  async (args) => {
    // Simulate weather data
    const temp = Math.floor(Math.random() * 30) + 10;
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)];
    const displayTemp = args.units === 'fahrenheit' ? (temp * 9/5) + 32 : temp;
    const unit = args.units === 'fahrenheit' ? '°F' : '°C';

    return {
      content: [{
        type: 'text',
        text: `Weather in ${args.city}: ${conditions}, ${displayTemp.toFixed(1)}${unit}`,
      }],
    };
  }
);

// Create a data formatter tool
const dataFormatterTool = tool(
  'format_data',
  'Format data into different structures (JSON, table, list)',
  {
    data: z.array(z.record(z.any())).describe('Array of objects to format'),
    format: z.enum(['json', 'table', 'list']).describe('Output format'),
  },
  async (args) => {
    let formatted: string;

    switch (args.format) {
      case 'json':
        formatted = JSON.stringify(args.data, null, 2);
        break;
      case 'table':
        if (args.data.length === 0) {
          formatted = 'No data';
          break;
        }
        const headers = Object.keys(args.data[0]);
        formatted = headers.join(' | ') + '\n' +
                   headers.map(() => '---').join(' | ') + '\n' +
                   args.data.map(row => headers.map(h => row[h]).join(' | ')).join('\n');
        break;
      case 'list':
        formatted = args.data.map((item, i) => `${i + 1}. ${JSON.stringify(item)}`).join('\n');
        break;
    }

    return {
      content: [{
        type: 'text',
        text: formatted,
      }],
    };
  }
);

async function customToolsExample() {
  console.log('=== Custom Tools Example ===\n');

  try {
    // Create an MCP server with our custom tools
    const mcpServer = createSdkMcpServer({
      name: 'custom-tools',
      version: '1.0.0',
      tools: [calculatorTool, weatherTool, dataFormatterTool],
    });

    // Use the tools in a query
    const result = query({
      prompt: 'Calculate 15 + 27, then get the weather for Paris, and format this data as a table: [{"name":"Alice","age":30},{"name":"Bob","age":25}]',
      options: {
        mcpServers: [mcpServer],
        // Allow built-in tools plus our custom MCP tools
        allowedTools: ['calculator', 'get_weather', 'format_data'],
      }
    });

    for await (const message of result) {
      if (message.type === 'assistant' && message.text) {
        console.log('Assistant:', message.text);
      } else if (message.type === 'tool_use') {
        console.log(`\n[Using tool: ${message.name}]`);
        console.log('Input:', JSON.stringify(message.input, null, 2));
      } else if (message.type === 'result') {
        console.log('[Tool completed]\n');
      }
    }

    console.log('\n✓ Custom tools example completed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  customToolsExample();
}

export { customToolsExample };


