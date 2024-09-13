// salesforce-integration.js

class SalesforceIntegration {
    username = 'chandan.singh14@q2.com';
    password = 'welcome124';
    securityToken = 'H9chJdQbBWylrqZzekQeqM67M';
    constructor() {
      this.jsforce = require('jsforce');
      this.conn = null;
    }
  
    async connect() {
      if (this.conn) return; // Already connected
  
      this.conn = new this.jsforce.Connection({
        // You can specify a custom login URL if needed
        loginUrl: 'https://test.salesforce.com'
      });
  
      try {
        await this.conn.login(this.username, this.password + this.securityToken);
        console.log('Connected to Salesforce');
      } catch (err) {
        console.error('Error connecting to Salesforce:', err);
        throw err;
      }
    }
  
    async createLoanApplication(applicationData) {
      if (!this.conn) {
        await this.connect();
      }
  
      try {
        const result = await this.conn.sobject('Loan_Application__c').create(applicationData);
        console.log('Loan Application created, ID:', result.id);
        return result.id;
      } catch (err) {
        console.error('Error creating Loan Application:', err);
        throw err;
      }
    }
  
    async queryLoanApplication(applicationId) {
      if (!this.conn) {
        await this.connect();
      }
  
      try {
        const result = await this.conn.sobject('Loan_Application__c')
          .retrieve(applicationId);
        console.log('Loan Application retrieved:', result);
        return result;
      } catch (err) {
        console.error('Error querying Loan Application:', err);
        throw err;
      }
    }
  
    // Add more methods for other Salesforce operations as needed
  }
  
  // Export the class for use in other files
  export default SalesforceIntegration;