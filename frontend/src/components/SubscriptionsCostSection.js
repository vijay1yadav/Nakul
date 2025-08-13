import React, { useMemo } from 'react';

// Fluent UI Imports
import {
    makeStyles,
    shorthands,
    tokens,
    Card,
    CardHeader,
    Body1,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Spinner,
    Dropdown,
    Option,
    Text,
} from '@fluentui/react-components';

// Fluent UI Icon Imports
import {
    MoneyFilled,
} from '@fluentui/react-icons';


// Use makeStyles for all styling
const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
    },
    controls: {
        display: 'flex',
        flexWrap: 'wrap',
        ...shorthands.gap('16px'),
        alignItems: 'center',
        paddingBottom: tokens.spacingVerticalL,
    },
    tableContainer: {
        maxHeight: '600px',
        overflowY: 'auto',
    },
    costDisplay: {
        display: 'flex',
        alignItems: 'center',
        ...shorthands.gap(tokens.spacingHorizontalS),
        color: tokens.colorNeutralForeground2,
    }
});

const SubscriptionsCostSection = ({ subscriptions, selectedSubscription, setSelectedSubscription, subscriptionColumns }) => {
    const styles = useStyles();

    // --- FIX IS HERE: Moved hooks and logic before the early return ---
    const filteredSubscriptions = useMemo(() => {
        if (!selectedSubscription || selectedSubscription === 'all') {
            return subscriptions; // Show all if nothing is selected or 'all' is selected
        }
        return subscriptions.filter(sub => sub.subscriptionId === selectedSubscription);
    }, [subscriptions, selectedSubscription]);

    const selectedSubscriptionData = useMemo(() =>
        subscriptions.find(sub => sub.subscriptionId === selectedSubscription),
        [subscriptions, selectedSubscription]
    );

    // Calculate cost based on selection
    const displayedCost = selectedSubscriptionData
        ? selectedSubscriptionData.cost
        : subscriptions.reduce((total, sub) => total + (sub.cost || 0), 0);

    // Determine the name to show in the dropdown
    const selectedSubscriptionName = selectedSubscriptionData?.displayName || "All Subscriptions";


    // Check if data is still loading
    if (!subscriptions || subscriptions.length === 0) {
        return <Spinner label="Loading subscriptions data..." />;
    }

    return (
        <div className={styles.root}>
            <Card>
                <CardHeader
                    header={
                        <div className={styles.controls}>
                            <Dropdown
                                value={selectedSubscriptionName}
                                onOptionSelect={(_, data) => setSelectedSubscription(data.optionValue)}
                            >
                                <Option key="all" text="All Subscriptions" value="all">
                                    All Subscriptions
                                </Option>
                                {subscriptions.map(sub => (
                                    <Option key={sub.subscriptionId} text={sub.displayName} value={sub.subscriptionId}>
                                        {sub.displayName}
                                    </Option>
                                ))}
                            </Dropdown>
                            <div className={styles.costDisplay}>
                                <MoneyFilled />
                                <Text weight="semibold">Displayed Cost:</Text>
                                <Body1>${(displayedCost || 0).toFixed(2)}</Body1>
                            </div>
                        </div>
                    }
                />
                <div className={styles.tableContainer}>
                    <Table aria-label="Subscriptions Cost Table">
                        <TableHeader>
                            <TableRow>
                                {subscriptionColumns.map(column => (
                                    <TableHeaderCell key={column.Header}>
                                        {column.Header}
                                    </TableHeaderCell>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Map over the filtered list instead of the full list */}
                            {filteredSubscriptions.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.displayName}</TableCell>
                                    <TableCell>${(item.cost || 0).toFixed(2)}</TableCell>
                                    <TableCell>{item.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

export default SubscriptionsCostSection;
