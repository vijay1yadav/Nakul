// utils/batchProcessor.js

/**
 * Processes an array of items in controlled, concurrent batches.
 *
 * @param {Array<T>} items The array of items to process.
 * @param {function(T): Promise<U>} asyncOperation The async function to run for each item.
 * @param {number} batchSize The number of concurrent operations to run at once.
 * @returns {Promise<Array<U>>} A promise that resolves with an array of all the results.
 * @template T, U
 */
const processInBatches = async (items, asyncOperation, batchSize = 5) => {
    const results = [];
    let currentPosition = 0;

    while (currentPosition < items.length) {
        // Get the next batch of items to process
        const itemsToProcess = items.slice(currentPosition, currentPosition + batchSize);

        // Create promises for the current batch
        const batchPromises = itemsToProcess.map(item => asyncOperation(item));

        // Wait for the current batch to complete
        const batchResults = await Promise.all(batchPromises);

        // Add the results of the batch to the main results array
        results.push(...batchResults);

        // Move to the next position
        currentPosition += batchSize;
    }

    return results;
};

module.exports = { processInBatches };