import { runSchemaTests } from './src/types/schema.test';
import { runToolTests } from './src/lib/tools/index.test';

const runAllTests = async () => {
  console.log('🚀 Launching Trip Flow backend test suite...');
  try {
    await runSchemaTests();
    console.log('\n----------------------------------------\n');
    await runToolTests();
    console.log('\n✨ All backend suites passed successfully!');
  } catch (err) {
    console.error('❌ Test suite execution failed:', err);
    process.exit(1);
  }
};

runAllTests();
