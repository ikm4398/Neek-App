// Copyright (c) 2026, a and contributors
// For license information, please see license.txt

frappe.ui.form.on('Antarik Patrachar Table', {
    transformer_serial_no: function(frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        if (!row.transformer_serial_no) {
            return;
        }

        frappe.db.get_doc('Serial No', row.transformer_serial_no).then(serial => {
            const fullSerial = serial.name || '';
            let trimmedSerial = fullSerial;
            const lastDot = fullSerial.lastIndexOf('.');
            const lastDash = fullSerial.lastIndexOf('-');
            const separator = lastDot > lastDash ? '.' : (lastDash > lastDot ? '-' : null);
            if (separator) {
                trimmedSerial = fullSerial.split(separator).pop();
            }

            frappe.model.set_value(cdt, cdn, 'serial_no', trimmedSerial);
            frappe.model.set_value(cdt, cdn, 'item_code', serial.item_code);
            frappe.model.set_value(cdt, cdn, 'item_name', serial.item_name);
            frappe.model.set_value(cdt, cdn, 'production_plan', serial.production_plan);
            frappe.model.set_value(cdt, cdn, 'status', serial.status);
            frappe.model.set_value(cdt, cdn, 'remarks', serial.description);

            if (serial.production_plan) {
                frappe.db.get_doc('Production Plan', serial.production_plan).then(pp => {
                    frappe.model.set_value(cdt, cdn, 'job_order', pp.reference);
                    frappe.model.set_value(cdt, cdn, 'customer', pp.customer);
                    

                    if (pp.reference) {
                        frappe.db.get_doc('Job Order', pp.reference).then(jo => {
                            frappe.model.set_value(cdt, cdn, 'kva', jo.kva);
                            frappe.model.set_value(cdt, cdn, 'tapping', jo.tapping);
                        });
                    }

                    frappe.db.get_list('Work Order', {
                        fields: ['name'],
                        filters: {
                            production_plan: serial.production_plan,
                            operation: '5) Testing'
                        },
                        order_by: 'modified desc',
                        limit_page_length: 1
                    }).then(result => {
                        if (result && result.length) {
                            frappe.db.get_doc('Work Order', result[0].name).then(wo => {
                                frappe.model.set_value(cdt, cdn, 'tested_date', wo.modified);
                                if (wo.modified_by) {
                                    frappe.db.get_doc('User', wo.modified_by).then(user => {
                                        frappe.model.set_value(cdt, cdn, 'tested_by', user.full_name || wo.modified_by);
                                    });
                                }
                            });
                        }
                    });
                });
            }
        });
    }
});
