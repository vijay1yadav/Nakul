import React from 'react';
import { Doughnut } from 'react-chartjs-2';
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
    Dropdown,
    Option,
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

const TopResourcesCostSection = ({ topResources, topResourceLimit, setTopResourceLimit, topResourcesChartData, topResourcesColumns }) => {
    const styles = useStyles();

    // Check if data is still loading
    if (!topResources || topResources.length === 0) {
        return <Spinner label="Loading top resources data..." />;
    }

    // --- FIX IS HERE: Adding multiple colors for the Doughnut chart ---
    const colorfulChartData = {
        ...topResourcesChartData,
        datasets: topResourcesChartData.datasets.map(dataset => ({
            ...dataset,
            backgroundColor: [
                '#0078d4', '#107c10', '#d13438', '#ffb900', '#742774',
                '#004e8c', '#0c5c0c', '#a4262c', '#cc9a00', '#5c1f5c',
                '#002d51', '#073b07', '#7a1c20', '#997400', '#431743',
                '#6cbbf7', '#79f779', '#f78386', '#fde293', '#d69ad6'
            ],
            borderColor: tokens.colorNeutralBackground1,
            borderWidth: 2,
        }))
    };

    return (
        <div className={styles.root}>
            <Card>
                <CardHeader
                    header={<Subtitle1>Top Resources by Cost</Subtitle1>}
                // The filter dropdown has been moved from here
                />
                <div className={styles.chartContainer}>
                    <Doughnut // Using Doughnut chart as requested
                        data={colorfulChartData} // Use the new colorful data
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { position: 'top' },
                                tooltip: { callbacks: { label: (context) => `${context.label}: $${context.parsed}` } },
                            },
                        }}
                    />
                </div>
            </Card>
            <Card>
                <CardHeader
                    header={<Subtitle1>Top Resources Details</Subtitle1>}
                    // --- FIX IS HERE: Filter is now in the details card ---
                    action={
                        <Dropdown
                            value={`Top ${topResourceLimit}`}
                            onOptionSelect={(_, data) => setTopResourceLimit(Number(data.optionValue))}
                        >
                            <Option text="Top 5" value="5">Top 5</Option>
                            <Option text="Top 10" value="10">Top 10</Option>
                            <Option text="Top 15" value="15">Top 15</Option>
                            <Option text="Top 20" value="20">Top 20</Option>
                        </Dropdown>
                    }
                />
                <div className={styles.tableContainer}>
                    <Table aria-label="Top Resources Cost Table">
                        <TableHeader>
                            <TableRow>
                                {topResourcesColumns.map(column => (
                                    <TableHeaderCell key={column.Header}>
                                        {column.Header}
                                    </TableHeaderCell>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topResources.slice(0, topResourceLimit).map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>${(item.cost || 0).toFixed(2)}</TableCell>
                                    <TableCell>{item.type}</TableCell>
                                    <TableCell>{item.location}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

export default TopResourcesCostSection;
