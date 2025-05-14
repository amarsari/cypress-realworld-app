import { User } from "../../../src/models"
import { isMobile } from "../../support/utils"

const apiGraphQL = `${Cypress.env("apiUrl")}/graphql`

type BankAccountsTestCtx = {
    user?: User
}

describe("Bank Accounts", () => {
    const ctx: BankAccountsTestCts = {};

    beforeEach(() => {
        cy.task("db:seed");

        cy.intercept("GET", "/notifications").as("getNotifications");

        cy.intercept("POST", apiGraphQL, (req) => {
            const operationAliases: Record<string, string> = {
                ListBankAccount: "gqlListBankAccountQuery",
                CreateBankAccount: "gqlCreateBankAccountMutation",
                DeleteBankAccount: "gqlDeleteBankAccountMutation",
            };

            const { body } = req;

            const operationName = body?.operationName;

            if (
                body.hasOwnProperty("operationName") &&
                operationName &&
                operationAliases[operationName]
             ) {
                req.alias = operationAliases[operationName];
             }
        });

        cy.database("find", "users").then((user: User) => {
            ctx.user = user;
            return cy.loginByXstate(ctx.user.username);
        });
    });

    it("Creates a new bank account", () => {
        cy.wait("@getNotifications");

        if (isMobile()) {
            cy.getBySel("sidenav-toggle").click();
        }

        cy.getBySel("sidenav-bankaccounts").click();

        cy.getBySel("bankaccount-new").click();
        cy.location("pathname").should("eq", "/bankaccounts/new");
        cy.visualSnapshot("Display New Bank Account Form");

        cy.getBySelLike("bankName-input").type("The Best Bank");
        cy.getBySelLike("routingNumber-input").type("987654321");
        cy.getBySelLike("accountNumber-input").type("123456789");
        cy.visualSnapshot("Fill out New Bank Account Form");
        cy.getBySelLike("submit").click();

        cy. wait("@gqlCreateBankAccountMutation");  

        cy.getBySelLike("bankaccount-list-item").should("have.length", 2).eq(1).should("contain", "The Best Bank");
        cy.visualSnapshot("Bank Account Created");
    });
})