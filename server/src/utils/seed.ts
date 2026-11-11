import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.js';
import { CompanySettings } from '../models/CompanySettings.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';
import { InvoiceCounter } from '../models/InvoiceCounter.js';

export const seedInitialData = async (): Promise<void> => {
  try {
    // 1. Seed Admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({
        name: 'Chief Admin',
        email: 'admin@calendar.com',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('🌱 Default Admin created: admin@calendar.com / admin123');
    }

    // 2. Seed Company Settings
    const settingsCount = await CompanySettings.countDocuments();
    if (settingsCount === 0) {
      await CompanySettings.create({
        companyName: 'Amazing Ads',
        logoUrl: '',
        address: '124, Sivakasi Main Road, Printing Hub',
        mobile: '+91 98421 77889',
        email: 'orders@amazingads.com',
        gstin: '33AABCS1429B1Z8',
        state: 'Tamil Nadu',
        pincode: '626123',
        invoicePrefix: 'CAL',
        startingNumber: 1001,
        financialYear: '2026-27',
        currency: 'INR',
        defaultGstRate: 12,
        invoiceFooterText:
          'Thank you for partnering with Amazing Ads! Premium calendar quality crafted to perfection.',
        termsAndConditions:
          '1. Goods once sold will not be returned or exchanged.\n2. Printing design proof confirmed by client is final for offset production.\n3. All disputes are subject to Sivakasi Jurisdiction only.\n4. Overdue balances will attract 18% p.a. interest after 30 days.',
      });
      console.log('🌱 Default Company Settings initialized.');
    }

    // 3. Seed Products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany([
        {
          name: 'Royal Gold Foil 12-Sheet Wall Calendar',
          sku: 'CAL-GF-01',
          category: 'Gold Foil Calendar',
          size: '15x20 inch',
          description: 'Premium gold hot-stamping with 130 GSM art paper and metal tin rimming.',
          sellingPrice: 180,
          status: 'Active',
        },
        {
          name: 'Divine Stone Embossed 6-Sheet Calendar',
          sku: 'CAL-ST-02',
          category: 'Stone Calendar',
          size: '11x18 inch',
          description: 'Authentic stone texture embossing with glossy UV spot varnish.',
          sellingPrice: 220,
          status: 'Active',
        },
        {
          name: '5D Hologram Multi-Layer Scenic Calendar',
          sku: 'CAL-5D-03',
          category: '5D Calendar',
          size: '17x27 inch',
          description: 'High-depth 5D lenticular visual with heavy board backing.',
          sellingPrice: 310,
          status: 'Active',
        },
        {
          name: 'Classic Daily Tamil / English Tear-Off Calendar',
          sku: 'CAL-DL-04',
          category: 'Daily Calendar',
          size: '10x15 inch',
          description: 'Traditional daily slip pad with auspicious times and panchangam.',
          sellingPrice: 85,
          status: 'Active',
        },
        {
          name: 'Executive Tabletop Wire-O Desk Calendar',
          sku: 'CAL-MO-05',
          category: 'Monthly Calendar',
          size: '8.5x6 inch',
          description: '12-month desktop standee calendar with memo space on matte card.',
          sellingPrice: 140,
          status: 'Active',
        },
        {
          name: 'Custom Corporate Branded Wall Calendar',
          sku: 'CAL-CU-06',
          category: 'Customized Calendar',
          size: '14x22 inch',
          description: 'Full custom design with company logo, product photos, and color theme.',
          sellingPrice: 195,
          status: 'Active',
        },
        {
          name: 'Pocket Mini Almanac Calendar Book',
          sku: 'CAL-OT-07',
          category: 'Other Calendars',
          size: '4x6 inch',
          description: 'Compact pocket diary calendar with holiday lists and year view.',
          sellingPrice: 35,
          status: 'Active',
        },
      ]);
      console.log('🌱 Sample Calendar Products seeded.');
    }

    // 4. Seed Customers
    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      await Customer.insertMany([
        {
          name: 'K. Rajasekaran',
          mobile: '9842100001',
          email: 'rajasekaran@balajitex.com',
          companyName: 'Sri Balaji Textiles',
          gstin: '33AABCS1234A1Z5',
          billingAddress: '45, East Veli Street',
          city: 'Madurai',
          state: 'Tamil Nadu',
          pincode: '625001',
        },
        {
          name: 'S. Muthukumar',
          mobile: '9443200002',
          email: 'purchase@meenakshijewels.in',
          companyName: 'Meenakshi Jewellers',
          gstin: '33AACCM5678B1Z2',
          billingAddress: '102, Cross Cut Road, Gandhipuram',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: '641012',
        },
        {
          name: 'Anand Hegde',
          mobile: '9880100003',
          email: 'anand@bangaloreprint.com',
          companyName: 'Bangalore Printing Supplies',
          gstin: '29AABCB9012C1Z8', // Karnataka (Inter-State IGST)
          billingAddress: '78, Avenue Road, City Market',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560002',
        },
      ]);
      console.log('🌱 Sample Customers seeded.');
    }

    // 5. Seed Initial Invoice & Counter
    const invoiceCount = await Invoice.countDocuments();
    if (invoiceCount === 0) {
      const sampleCustomer = await Customer.findOne({ mobile: '9842100001' });
      const sampleProduct = await Product.findOne({ sku: 'CAL-GF-01' });

      if (sampleCustomer && sampleProduct) {
        await InvoiceCounter.findOneAndUpdate(
          { identifier: 'CAL-2026-27' },
          { seq: 1001 },
          { returnDocument: 'after', upsert: true }
        );

        await Invoice.create({
          invoiceNumber: 'CAL/2026-27/1001',
          invoiceDate: new Date(),
          customer: sampleCustomer._id,
          customerSnapshot: {
            name: sampleCustomer.name,
            mobile: sampleCustomer.mobile,
            email: sampleCustomer.email,
            companyName: sampleCustomer.companyName,
            gstin: sampleCustomer.gstin,
            billingAddress: sampleCustomer.billingAddress,
            city: sampleCustomer.city,
            state: sampleCustomer.state,
            pincode: sampleCustomer.pincode,
          },
          items: [
            {
              productId: sampleProduct._id,
              name: sampleProduct.name,
              sku: sampleProduct.sku,
              category: sampleProduct.category,
              size: sampleProduct.size,
              quantity: 100,
              unit: 'Pieces',
              rate: sampleProduct.sellingPrice,
              discount: 500,
              taxableAmount: 17500,
              gstPercentage: 12,
              gstAmount: 2100,
              totalAmount: 19600,
            },
          ],
          subtotal: 18000,
          itemDiscountTotal: 500,
          additionalDiscount: 0,
          taxableAmount: 17500,
          isGstInvoice: true,
          isInterState: false,
          cgstAmount: 1050,
          sgstAmount: 1050,
          igstAmount: 0,
          totalGstAmount: 2100,
          roundOff: 0,
          grandTotal: 19600,
          status: 'Active',
          notes: 'Initial sample festive calendar order',
        });
        console.log('🌱 Sample Invoice CAL/2026-27/1001 seeded.');
      }
    }
  } catch (error) {
    console.error('Error during data seeding:', error);
  }
};

