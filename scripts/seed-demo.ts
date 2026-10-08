import 'dotenv/config';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

// Creates (or recreates) a "Demo Fleet" workspace with ~3 months of entries.
// Login: demo@mailinator.com / password123   (driver: demo-driver@mailinator.com)
const DAILY = ['Sacco', 'Fuel', 'Driver', 'Gate', 'ExpW', 'Car wash', 'Police', 'Stage fees', 'Other'];
const FIXED = ['Insurance', 'County seasonal parking', 'Repairs & maintenance', 'Vehicle service', 'Wages - other employees', 'Tithe', 'Other recurring'];
const TAGS: Record<string, string> = { Driver: 'driver', 'Wages - other employees': 'wages', Tithe: 'tithe' };

let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const around = (n: number, spread = 0.2) => Math.round((n * (1 - spread + rand() * spread * 2)) / 10) * 10;

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1, onnotice: () => {} });
  await sql`delete from organizations where slug = 'demo-fleet'`;
  const hash = await bcrypt.hash('password123', 10);
  await sql.begin(async (tx) => {
    const [org] = await tx`insert into organizations (name, slug, phone, email, tagline)
      values ('Demo Fleet Investments', 'demo-fleet', '0700 000 000', 'demo@mailinator.com', 'Moving Kenya forward') returning id`;
    const cat: Record<string, string> = {};
    for (const [i, name] of [...DAILY, ...FIXED].entries()) {
      const [c] = await tx`insert into expense_categories (organization_id, name, kind, tag, sort_order)
        values (${org.id}, ${name}, ${DAILY.includes(name) ? 'daily' : 'fixed'}, ${TAGS[name] ?? null}, ${i}) returning id`;
      cat[name] = c.id;
    }
    const [owner] = await tx`insert into users (organization_id, email, password_hash, full_name, role)
      values (${org.id}, 'demo@mailinator.com', ${hash}, 'Demo Owner', 'owner') returning id`;
    const [driver] = await tx`insert into users (organization_id, email, password_hash, full_name, role)
      values (${org.id}, 'demo-driver@mailinator.com', ${hash}, 'Demo Driver', 'recorder') returning id`;
    const vehicles = [
      { reg: 'KCX 123A', nick: 'KCX', base: 15000 },
      { reg: 'KDA 456B', nick: 'KDA', base: 12000 },
    ];
    for (const v of vehicles) {
      const [veh] = await tx`insert into vehicles (organization_id, registration, nickname, sacco, route, capacity, make_model)
        values (${org.id}, ${v.reg}, ${v.nick}, 'Super Metro', 'Kikuyu – CBD', 33, 'Isuzu NQR') returning id`;
      if (v.nick === 'KCX') await tx`insert into user_vehicles (user_id, vehicle_id) values (${driver.id}, ${veh.id})`;
      for (let d = new Date(Date.UTC(2026, 6, 1)); d <= new Date(Date.UTC(2026, 9, 5)); d.setUTCDate(d.getUTCDate() + 1)) {
        if (d.getUTCDay() === 0) continue; // Sundays off
        const date = d.toISOString().slice(0, 10);
        const income = around(d.getUTCDay() === 6 ? v.base * 0.55 : v.base);
        const [e] = await tx`insert into daily_entries (organization_id, vehicle_id, entry_date, income, parcels, recorded_by)
          values (${org.id}, ${veh.id}, ${date}, ${income}, ${rand() < 0.6 ? around(900, 0.6) : 0}, ${owner.id}) returning id`;
        const lines: [string, number][] = [
          ['Sacco', around(income * 0.09, 0.1)],
          ['Fuel', around(income * 0.3)],
          ['Driver', around(900, 0.15)],
          ['Gate', 250],
          ['ExpW', around(1100, 0.3)],
          ['Police', rand() < 0.4 ? 50 : 0],
          ['Car wash', rand() < 0.2 ? 250 : 0],
        ];
        for (const [name, amount] of lines) {
          if (amount > 0) await tx`insert into daily_entry_expenses (entry_id, category_id, amount) values (${e.id}, ${cat[name]}, ${amount})`;
        }
      }
      for (const month of ['2026-07-01', '2026-08-01', '2026-09-01']) {
        for (const [name, amount] of [['Insurance', 9000], ['Vehicle service', around(6000, 0.4)], ['County seasonal parking', 2500]] as const) {
          await tx`insert into fixed_expenses (organization_id, vehicle_id, category_id, month, amount) values (${org.id}, ${veh.id}, ${cat[name]}, ${month}, ${amount})`;
        }
      }
    }
    for (const month of ['2026-07-01', '2026-08-01', '2026-09-01']) {
      await tx`insert into fixed_expenses (organization_id, category_id, month, amount, description) values (${org.id}, ${cat['Wages - other employees']}, ${month}, 20000, 'Stage marshal + clerk')`;
      await tx`insert into fixed_expenses (organization_id, category_id, month, amount) values (${org.id}, ${cat.Tithe}, ${month}, ${around(12000, 0.1)})`;
    }
  });
  console.log('Demo workspace ready: demo@mailinator.com / password123');
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
