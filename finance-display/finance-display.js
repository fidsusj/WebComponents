import {LitElement, html, css} from 'lit-element';
import {repeat} from 'lit-html/directives/repeat';
import './finance-chart'
import './finance-list'
import '@vaadin/vaadin-text-field/vaadin-text-field';
import '@vaadin/vaadin-text-field/vaadin-number-field';
import '@vaadin/vaadin-radio-button/vaadin-radio-group';
import '@vaadin/vaadin-radio-button/vaadin-radio-button';
import '@vaadin/vaadin-button/vaadin-button';
import '@vaadin/vaadin-item/vaadin-item';
import '@vaadin/vaadin-checkbox/vaadin-checkbox'
import '@vaadin/vaadin-combo-box/vaadin-combo-box'

export class FinanceDisplay extends LitElement {

    render() {
        let data = [];
        let sum = new Map();
        if(this.transactions.length === 0){
            data.push({amount: 0, category: ""});
        } else {
            for(let element of this.transactions){
                if(!sum.get(element.category)){
                    sum.set(element.category, element.price)
                } else {
                    sum.set(element.category, sum.get(element.category) + element.price);
                }
            }
            for (let [category, amount] of sum) {
                data.push({category: category, amount: amount});
            }
        }

        return html`
            <div class="grid">
                <div class="one-one">
                    <finance-chart labelX="categories" labelY="Spent money" data="${JSON.stringify(data)}"></finance-chart>
                </div>
                <div class="one-two">
                    <vaadin-text-field id="description" label="Description"></vaadin-text-field>
                    <vaadin-number-field id="price" label="Price in €" step="0.01" has-controls></vaadin-number-field>
                    <br />
                     <vaadin-radio-group id="category" label="Category">
                        ${repeat(this.supportedCategories, (element) => element, (element) => html`
                            <vaadin-radio-button>${element}</vaadin-radio-button>
                        `)}
                    </vaadin-radio-group>
                    <br />
                    <vaadin-button theme="success primary" @click="${this.handleTransactionInput}">Save</vaadin-button>
                    <vaadin-button theme="error primary" @click="${() => { this.transactions = [];}}">Delete All</vaadin-button>
                </div>
                <div class="two-one">
                    <vaadin-item><strong>Filter bar:</strong></vaadin-item>
                    <finance-list 
                        transactions="${JSON.stringify(this.transactions)}" 
                        filter="${JSON.stringify(this.filter)}" 
                        restriction=3
                        selectable
                        @item-clicked="${(evt) => {
                            if(evt.detail.selected) {
                                this.selectedItems.push(evt.detail.description);
                            } else {
                                this.selectedItems.splice(this.selectedItems.indexOf(evt.description));
                            }
                            this.requestUpdate();
                        }}">
                    </finance-list>
                </div>
                <div class="two-two">
                    <br />
                    <br />
                    <br />
                    ${this.supportedCategories.map((category) => {
                        return html`
                            <vaadin-checkbox checked 
                                             @change="${(evt) => {
                                                 let categories = this.filter.categories;  //passed by reference
                                                 let value = evt.target.innerText;
                                                 let checked = evt.target.checked;
                                                 if(checked) {
                                                     categories.push(value);
                                                     this.filter.categories = categories;
                                                 } else {
                                                     categories.splice( categories.indexOf(value), 1 );
                                                     this.filter.categories = categories;
                                                 }
                                                this.requestUpdate();
                                             }}">
                                ${category}
                            </vaadin-checkbox>
                        `;
                    })}
                    <br />
                    <vaadin-combo-box label="Type" items="${JSON.stringify(this.supportedTypes)}" 
                                      @change="${(evt) => {
                                          let type = evt.target.selectedItem;
                                          type ? this.filter.types = new Array(type) : this.filter.types = this.supportedTypes;
                                          this.requestUpdate();
                                      }}">
                    </vaadin-combo-box>
                    <vaadin-combo-box label="FilterOperator" id="operator" items="${JSON.stringify(['EQ', 'GT', 'LT', 'BT'])}" @change="${this.handlePriceRange}"></vaadin-combo-box>
                    <br />
                    <vaadin-number-field id="PriceFrom" label="PriceFrom" step="0.01" has-controls @change="${this.handlePriceRange}"></vaadin-number-field>
                    <vaadin-number-field id="PriceTo" label="PriceTo" step="0.01" has-controls disabled @change="${this.handlePriceRange}"></vaadin-number-field>
                </div>
            </div>
        `;
    }

    static get styles() {
        return css`
            .grid {display: grid; height: 100%; }
            .one-one { grid-row: 1; grid-column-start: 1; grid-column-end: 11; }
            .one-two { grid-row: 1; grid-column: 11; }
            .two-one { grid-row: 2; grid-column-start: 1; grid-column-end: 11; }
            .two-two { grid-row: 2; grid-column: 11; }
        `;
    }

    static get properties() {
        return {
            transactions: {type: Array},
            supportedCategories: {type: Array},
            supportedTypes: {type: Array},
            filter: {type: Object},
            selectedItems: {type: Array}
        }
    }

    constructor() {
        super();
        this.transactions = [];
        this.supportedCategories = ["Job", "Food", "Family", "Car", "Lifestyle", "Uncategorized"];
        this.supportedTypes = ["profit", "loss"];
        this.filter = {
            types: Object.assign(this.supportedTypes).flat(),
            descriptions: [],
            categories: Object.assign(this.supportedCategories).flat(),
            priceRange: {operator: 'BT',
                firstValue: -Number.MAX_VALUE,
                secondValue: Number.MAX_VALUE
            }
        };
        this.selectedItems = [];

    }

    handleTransactionInput() {
        let description = this.shadowRoot.getElementById('description');
        let price = this.shadowRoot.getElementById('price');
        let categories = Array.from(this.shadowRoot.getElementById('category').children);
        let category = '';
        for(let element of categories) {
            if(element.checked)
                category = element;
            element.checked = false;
        }
        let transaction = {
            type: price.value >= 0 ? this.supportedTypes[0] : this.supportedTypes[1],
            description: description.value || 'No description provided',
            category: category.innerText || 'Uncategorized',
            price: Number(price.value)
        };
        this.filter.descriptions = [...this.filter.descriptions, transaction.description];
        this.transactions = [...this.transactions, transaction];
        description.value = '';
        price.value = '';
    }

    handlePriceRange() {
        let operator = this.shadowRoot.getElementById('operator').selectedItem;
        let priceFrom  = this.shadowRoot.getElementById('PriceFrom');
        let priceTo  = this.shadowRoot.getElementById('PriceTo');
        if(!operator) {
            priceFrom.value = "";
            priceTo.value = "";
        }
        operator === 'BT' ? priceTo.disabled = false : priceTo.disabled = true;

        this.filter.priceRange = {
            operator: operator,
            firstValue: priceFrom.value ? Number(priceFrom.value) : undefined,
            secondValue: priceTo.value ? Number(priceTo.value) : undefined
        };
        this.requestUpdate();
    }
}
customElements.define('finance-display', FinanceDisplay);