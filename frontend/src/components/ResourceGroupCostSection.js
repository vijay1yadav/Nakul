import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

// Fluent UI Imports
import {
    makeStyles,
    shorthands,
    tokens,
    Card,
    CardHeader,
    Subtitle1,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Spinner,
} from '@fluentui/react-components';

// Register Chart.js components
Chart.register(...registerables);

// Use makeStyles for all styling
const useStyles = makeStyles({
    root: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        ...shorthands.gap('24px'),
    },
    chartContainer: {
        height: '400px',
        ...shorthands.padding(tokens.spacingVerticalL),
    },
    tableContainer: {
        maxHeight: '450px',
        overflowY: 'auto',
    },
});

const ResourceGroupCostSection = ({ resourceGroups, resourceGroupChartData, resourceGroupColumns }) => {
    const styles = useStyles();

    // Check if data is still loading
    if (!resourceGroups || resourceGroups.length === 0) {
        return <Spinner label="Loading resource group data..." />;
    }

    // Use a standard color for the chart
    const colorfulChartData = {
        ...resourceGroupChartData,
        datasets: resourceGroupChartData.datasets.map(dataset => ({
            ...dataset,
            backgroundColor: '#0078d4',
        }))
    };

    return (
        <div className={styles.root}>
            <Card>
                <CardHeader header={<Subtitle1>Resource Group Cost Chart</Subtitle1>} />
                <div className={styles.chartContainer}>
                    <Bar
                        data={colorfulChartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: { callbacks: { label: (context) => `$${context.parsed.y}` } },
                            },
                            scales: {
                                y: { title: { display: true, text: 'Cost ($)' } },
                                x: { title: { display: true, text: 'Resource Group' } },
                            },
                        }}
                    />
                </div>
            </Card>
            <Card>
                <CardHeader header={<Subtitle1>Resource Group Details</Subtitle1>} />
                <div className={styles.tableContainer}>
                    <Table aria-label="Resource Group Cost Table">
                        <TableHeader>
                            <TableRow>
                                {resourceGroupColumns.map(column => (
                                    <TableHeaderCell key={column.Header}>
                                        {column.Header}
                                    </TableHeaderCell>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {resourceGroups.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>${(item.cost || 0).toFixed(2)}</TableCell>
                                    <TableCell>{item.location}</TableCell>
                                    <TableCell>{item.resources}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

export default ResourceGroupCostSection;
