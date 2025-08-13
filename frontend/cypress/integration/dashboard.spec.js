describe('Dashboard E2E Tests', () => {
    beforeEach(() => {
        cy.intercept('GET', 'http://localhost:3001/subscriptions', {
            statusCode: 200,
            body: [{ subscriptionId: 'sub1', displayName: 'Sub 1', cost: 100 }],
        });
        cy.intercept('GET', 'http://localhost:3001/historicalCost', {
            statusCode: 200,
            body: { labels: ['Jan'], values: [500] },
        });
        cy.visit('http://localhost:3000'); // Adjust URL as needed
    });

    it('loads the overview section by default', () => {
        cy.contains('Overview').should('be.visible');
        cy.contains('Total Cost').should('be.visible');
        cy.contains('$100').should('be.visible');
    });

    it('navigates to the defender plan section', () => {
        cy.intercept('GET', 'http://localhost:3001/defenderPlan', {
            statusCode: 200,
            body: { enabled: true, cost: 200 },
        });

        cy.contains('Defender Plan').click();
        cy.contains('Microsoft Defender for Cloud Service Plan').should('be.visible');
        cy.contains('Enabled').should('be.visible');
    });
});