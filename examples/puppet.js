const puppeteer = require('puppeteer'); // v23.0.0 or later

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const timeout = 5000;
    page.setDefaultTimeout(timeout);

    {
        const targetPage = page;
        await targetPage.setViewport({
            width: 821,
            height: 930
        })
    }
    {
        const targetPage = page;
        await targetPage.goto('https://teamallenssm.com/jobs1_add.php?');
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Customer *[role=\\"textbox\\"])'),
            targetPage.locator('#value_Customer_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_Customer_1\\"])'),
            targetPage.locator(':scope >>> #value_Customer_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 47.4375,
                y: 22.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Business[role=\\"textbox\\"])'),
            targetPage.locator('#value_Business_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_Business_1\\"])'),
            targetPage.locator(':scope >>> #value_Business_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 110.296875,
                y: 20.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Type *)'),
            targetPage.locator('#value_Commercial_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_Commercial_1\\"])'),
            targetPage.locator(':scope >>> #value_Commercial_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 67.15625,
                y: 13.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Phone 1 *[role=\\"textbox\\"])'),
            targetPage.locator('#value_PhonePrimary_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_PhonePrimary_1\\"])'),
            targetPage.locator(':scope >>> #value_PhonePrimary_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 44.375,
                y: 9.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Phone 1 *[role=\\"textbox\\"])'),
            targetPage.locator('#value_PhonePrimary_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_PhonePrimary_1\\"])'),
            targetPage.locator(':scope >>> #value_PhonePrimary_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 81.078125,
                y: 16.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Phone 2[role=\\"textbox\\"])'),
            targetPage.locator('#value_PhoneAlternate_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_PhoneAlternate_1\\"])'),
            targetPage.locator(':scope >>> #value_PhoneAlternate_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 27.671875,
                y: 12.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(EMail *[role=\\"textbox\\"])'),
            targetPage.locator('#value_EMail_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_EMail_1\\"])'),
            targetPage.locator(':scope >>> #value_EMail_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 83.21875,
                y: 13.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Pay Type *)'),
            targetPage.locator('#value_fkJobType_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_fkJobType_1\\"])'),
            targetPage.locator(':scope >>> #value_fkJobType_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 88.21875,
                y: 18.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Insurance Company)'),
            targetPage.locator('#value_InsuranceCompany_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_InsuranceCompany_1\\"])'),
            targetPage.locator(':scope >>> #value_InsuranceCompany_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 52.21875,
                y: 9.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('tr:nth-of-type(2) > td:nth-of-type(1) div.r-edit-field'),
            targetPage.locator('::-p-xpath(//*[@id=\\"form_grid_1\\"]/tbody/tr[2]/td[1]/div/div[2])'),
            targetPage.locator(':scope >>> tr:nth-of-type(2) > td:nth-of-type(1) div.r-edit-field')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 72,
                y: 33.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Loss Type *)'),
            targetPage.locator('#value_fkLossType_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_fkLossType_1\\"])'),
            targetPage.locator(':scope >>> #value_fkLossType_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 92,
                y: 8.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Coordinator)'),
            targetPage.locator('#value_Coordinator_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_Coordinator_1\\"])'),
            targetPage.locator(':scope >>> #value_Coordinator_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 82.59375,
                y: 8.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Sales Mgr 1)'),
            targetPage.locator('#value_fkSalesPId_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_fkSalesPId_1\\"])'),
            targetPage.locator(':scope >>> #value_fkSalesPId_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 76.53125,
                y: 24.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Sales Mgr 2)'),
            targetPage.locator('#value_fkSalesP2Id_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_fkSalesP2Id_1\\"])'),
            targetPage.locator(':scope >>> #value_fkSalesP2Id_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 110.078125,
                y: 16.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Proj Mgr)'),
            targetPage.locator('#value_fkPrjMan_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_fkPrjMan_1\\"])'),
            targetPage.locator(':scope >>> #value_fkPrjMan_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 67.671875,
                y: 9.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Recon Mgr)'),
            targetPage.locator('#value_fkReconManId_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_fkReconManId_1\\"])'),
            targetPage.locator(':scope >>> #value_fkReconManId_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 120.21875,
                y: 11.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Job Status *)'),
            targetPage.locator('#value_JobStatus_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_JobStatus_1\\"])'),
            targetPage.locator(':scope >>> #value_JobStatus_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 85.21875,
                y: 23.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Claim#[role=\\"textbox\\"])'),
            targetPage.locator('#value_InsClaimNo_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_InsClaimNo_1\\"])'),
            targetPage.locator(':scope >>> #value_InsClaimNo_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 44.21875,
                y: 17.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Adjuster Type)'),
            targetPage.locator('#value_Adjuster1Type_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_Adjuster1Type_1\\"])'),
            targetPage.locator(':scope >>> #value_Adjuster1Type_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 101,
                y: 17.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Adjuster Company)'),
            targetPage.locator('#value_Adjuster1_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_Adjuster1_1\\"])'),
            targetPage.locator(':scope >>> #value_Adjuster1_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 97.59375,
                y: 8.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Adjuster Name)'),
            targetPage.locator('#value_Adjuster1Contact_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_Adjuster1Contact_1\\"])'),
            targetPage.locator(':scope >>> #value_Adjuster1Contact_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 65.53125,
                y: 14.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Adjuster2 Type)'),
            targetPage.locator('#value_Adjuster2Type_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_Adjuster2Type_1\\"])'),
            targetPage.locator(':scope >>> #value_Adjuster2Type_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 132.671875,
                y: 19.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Adjuster2 Company)'),
            targetPage.locator('#value_Adjuster2_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_Adjuster2_1\\"])'),
            targetPage.locator(':scope >>> #value_Adjuster2_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 139.21875,
                y: 14.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Adjuster2 Name)'),
            targetPage.locator('#value_Adjuster2Contact_1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_Adjuster2Contact_1\\"])'),
            targetPage.locator(':scope >>> #value_Adjuster2Contact_1')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 41.21875,
                y: 17.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Please select) >>>> ::-p-aria([role=\\"combobox\\"])'),
            targetPage.locator('#value_AddLocation_106'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_AddLocation_106\\"])'),
            targetPage.locator(':scope >>> #value_AddLocation_106')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 85.921875,
                y: 19.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Residence) >>>> ::-p-aria([role=\\"combobox\\"])'),
            targetPage.locator('#value_AddLocation_106'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_AddLocation_106\\"])'),
            targetPage.locator(':scope >>> #value_AddLocation_106')
        ])
            .setTimeout(timeout)
            .fill('1');
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria([role=\\"table\\"]) >>>> ::-p-aria([role=\\"checkbox\\"])'),
            targetPage.locator('#value_BillAddress_106'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_BillAddress_106\\"])'),
            targetPage.locator(':scope >>> #value_BillAddress_106')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 3.375,
                y: 5.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#value_Address1_106'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_Address1_106\\"])'),
            targetPage.locator(':scope >>> #value_Address1_106')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 93.359375,
                y: 7.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#value_Address2_106'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_Address2_106\\"])'),
            targetPage.locator(':scope >>> #value_Address2_106')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 91.25,
                y: 13.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#value_City_106'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_City_106\\"])'),
            targetPage.locator(':scope >>> #value_City_106')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 68.25,
                y: 12.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#value_State_106'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_State_106\\"])'),
            targetPage.locator(':scope >>> #value_State_106')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 62.25,
                y: 21.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#value_Zip_106'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_Zip_106\\"])'),
            targetPage.locator(':scope >>> #value_Zip_106')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 75.25,
                y: 9.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('#value_YearBuilt_106'),
            targetPage.locator('::-p-xpath(//*[@id=\\"value_YearBuilt_106\\"])'),
            targetPage.locator(':scope >>> #value_YearBuilt_106')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 22.25,
                y: 12.8125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Save)'),
            targetPage.locator('#saveButton1'),
            targetPage.locator('::-p-xpath(//*[@id=\\"saveButton1\\"])'),
            targetPage.locator(':scope >>> #saveButton1'),
            targetPage.locator('::-p-text(Save)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 34.09375,
                y: 16,
              },
            });
    }

    await browser.close();

})().catch(err => {
    console.error(err);
    process.exit(1);
});
