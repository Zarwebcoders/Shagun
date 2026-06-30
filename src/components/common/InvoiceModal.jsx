import React from 'react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';

const InvoiceModal = ({ isOpen, onClose, invoiceData, userData }) => {
    if (!isOpen || !invoiceData) return null;

    const quantity = invoiceData.quantity || 1;
    const unitPrice = invoiceData.displayAmount || invoiceData.amount || 0;
    const totalAmount = invoiceData.displayTotal || (unitPrice * quantity);

    const handlePrint = () => {
        const printContents = document.getElementById('shagun-invoice-container').innerHTML;
        
        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html>
                <head>
                    <title>Invoice INV-${userData?.referral_id || '000000'}</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; color: #000; background: #fff; line-height: 1.3; }
                        .invoice-wrap { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 2px solid #000; }
                        th, td { border: 2px solid #000; padding: 8px; text-align: left; font-size: 14px; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 10px; }
                        .divider { border-bottom: 2px solid #000; margin-bottom: 15px; width: 100%; }
                        .billed-to { margin-bottom: 15px; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .font-bold { font-weight: bold; }
                        .uppercase { text-transform: uppercase; }
                        p { margin: 2px 0; } /* Reduced spacing between p tags */
                        @media print {
                            @page { margin: 0; }
                            body { margin: 0.2cm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="invoice-wrap">
                        ${printContents}
                    </div>
                </body>
            </html>
        `);
        doc.close();

        // Print and cleanup
        const originalTitle = document.title;
        document.title = `Invoice INV-${userData?.referral_id || '000000'}`;
        
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        setTimeout(() => {
            document.title = originalTitle;
            document.body.removeChild(iframe);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl relative">
                
                {/* UI Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-300 sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-bold text-gray-800">Invoice Preview</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-1.5 bg-teal-600 text-white rounded text-sm font-medium hover:bg-teal-700 transition-colors"
                        >
                            <PrinterIcon className="w-4 h-4" />
                            Print / Save as PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Actual Invoice Content */}
                <div id="shagun-invoice-container" className="p-4 sm:p-10 text-gray-900 bg-white font-sans">
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10 header">
                        <div className="space-y-0"> {/* Removed space-y-1 */}
                            <h1 className="text-xl font-bold text-black uppercase mb-2">Punarva Product Pvt.Ltd</h1>
                            <div className="text-[13px] leading-tight">
                                <p className="m-0 py-[1px]">Billing Address:</p>
                                <p className="m-0 py-[1px]">Jk Cement, Dhandha</p>
                                <p className="m-0 py-[1px]">Himmatnagar,</p>
                                <p className="m-0 py-[1px]">Sabarkantha, Gujarat</p>
                                <p className="m-0 py-[1px]">GST Number : 24AAQCP3711J1ZA</p>
                                <p className="m-0 py-[1px]">Email: support@shagunpro.com</p>
                                <p className="m-0 py-[1px]">Phone: +91 9426060607</p>
                            </div>
                        </div>

                        <div className="text-left sm:text-right pt-2">
                            <h2 className="text-lg font-bold uppercase m-0">Invoice</h2>
                            <p className="text-sm m-0">Number: INV-{userData?.referral_id || '000000'}</p>
                            <p className="text-sm m-0">Date: {new Date(invoiceData.cereate_at).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="border-b border-gray-500 mb-8 divider"></div>

                    <div className="mb-10 billed-to">
                        <h3 className="text-sm font-bold uppercase mb-1">Billed To:</h3>
                        <p className="text-[15px] font-bold uppercase m-0">{userData?.full_name || 'Customer Name'}</p>
                        <p className="text-sm m-0">{userData?.email || 'customer@email.com'}</p>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse border-2 border-black min-w-[600px]">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border-2 border-black px-4 py-3 font-bold text-sm uppercase">Description</th>
                                    <th className="border-2 border-black px-4 py-3 font-bold text-sm uppercase text-center w-20">Qty</th>
                                    <th className="border-2 border-black px-4 py-3 font-bold text-sm uppercase text-right w-36">Unit Price</th>
                                    <th className="border-2 border-black px-4 py-3 font-bold text-sm uppercase text-right w-36">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="min-h-[100px]">
                                    <td className="border-2 border-black px-4 py-6 align-top">
                                        <div className="font-bold text-gray-900">{invoiceData.packag_type || 'Product Name'}</div>
                                        <div className="text-[10px] text-gray-500 mt-1">TXN: {invoiceData.transcation_id}</div>
                                    </td>
                                    <td className="border-2 border-black px-4 py-6 text-center align-top">{quantity}</td>
                                    <td className="border-2 border-black px-4 py-6 text-right align-top">{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td className="border-2 border-black px-4 py-6 text-right align-top font-bold">{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td colSpan="2" className="border-2 border-black"></td>
                                    <td className="border-2 border-black px-4 py-3 text-right font-bold uppercase text-sm">Grand Total</td>
                                    <td className="border-2 border-black px-4 py-3 text-right font-bold text-lg">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-16 text-center text-[10px] text-gray-400 italic no-print">
                        This is a computer generated invoice and does not require a physical signature.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
