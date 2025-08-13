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
    Body1,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Text,
    Spinner,
} from '@fluentui/react-components';

// Fluent UI Icon Imports
import {
    bundleIcon,
    MoneyFilled,
    MoneyRegular,
    DataTrendingFilled,
    DataTrendingRegular,
    AlertFilled,
    AlertRegular,
} from '@fluentui/react-icons';

// Register Chart.js components
Chart.register(...registerables);

// Bundle Icons for consistency
const MoneyIcon = bundleIcon(MoneyFilled, MoneyRegular);
const DataTrendingIcon = bundleIcon(DataTrendingFilled, DataTrendingRegular);
const AlertIcon = bundleIcon(AlertFilled, AlertRegular);

// Use makeStyles for all styling
const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('24px'),
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        ...shorthands.gap('16px'),
    },
    metricCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...shorthands.padding('16px'),
        textAlign: 'center',
    },
    metricIcon: {
        fontSize: '32px',
        color: tokens.colorBrandForeground1,
        marginBottom: tokens.spacingVerticalS,
    },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        ...shorthands.gap('24px'),
    },
    chartContainer: {
        height: '350px',
        ...shorthands.padding(tokens.spacingVerticalL),
    },
    tableContainer: {
        maxHeight: '400px',
        overflowY: 'auto',
    },
});

// Reusable MetricCard component for the summary badges
const MetricCard = ({ icon, title, value }) => {
    const styles = useStyles();
    return (
        <Card className={styles.metricCard}>
            <div className={styles.metricIcon}>{icon}</div>
            <Text size={800} weight="semibold">{value}</Text>
            <Body1>{title}</Body1>
        </Card>
    );
};

const MicrosoftSentinelCostSection = ({ sentinelCostData }) => {
    const styles = useStyles();
    const {
        monthlyCost = 0,
        yearlyCost = 0,
        dataIngested = 'N/A',
        alerts = 0,
        lastUpdated = 'N/A',
        costBreakdown = [],
    } = sentinelCostData;

    // Prepare data for the cost breakdown chart
    const chartData = {
        labels: costBreakdown.map(item => item.meter),
        datasets: [{
            label: 'Cost ($)',
            data: costBreakdown.map(item => item.cost),
            backgroundColor: '#0078d4', // Use standard hex color
        }],
    };

    // Check if data is still loading
    if (!sentinelCostData || Object.keys(sentinelCostData).length === 0) {
        return <Spinner label="Loading Microsoft Sentinel cost data..." />;
    }

    return (
        <div className={styles.root}>
            {/* The duplicate title has been removed */}
            <div className={styles.summaryGrid}>
                <MetricCard icon={<MoneyIcon />} title="Monthly Cost" value={`$${monthlyCost.toFixed(2)}`} />
                <MetricCard icon={<MoneyIcon />} title="Projected Yearly Cost" value={`$${yearlyCost.toFixed(2)}`} />
                <MetricCard icon={<DataTrendingIcon />} title="Data Ingested" value={dataIngested} />
                <MetricCard icon={<AlertIcon />} title="Alerts Generated" value={alerts} />
            </div>

            <div className={styles.mainGrid}>
                <Card>
                    <CardHeader header={<Subtitle1>Cost Breakdown by Meter</Subtitle1>} />
                    <div className={styles.chartContainer}>
                        <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </Card>
                <Card>
                    <CardHeader header={<Subtitle1>Detailed Costs</Subtitle1>} />
                    <div className={styles.tableContainer}>
                        <Table aria-label="Sentinel Cost Breakdown Table">
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell>Meter</TableHeaderCell>
                                    <TableHeaderCell>Cost ($)</TableHeaderCell>
                                    <TableHeaderCell>Quantity</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {costBreakdown.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.meter}</TableCell>
                                        <TableCell>${item.cost.toFixed(2)}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            <Body1 align="end" style={{ color: tokens.colorNeutralForeground2 }}>
                Last Updated: {lastUpdated}
            </Body1>
        </div>
    );
};

export default MicrosoftSentinelCostSection;
