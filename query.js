const { Client } = require("pg");
const c = new Client("postgresql://kyro:kyro_password@localhost:5432/kyro");
c.connect()
  .then(() =>
    c.query('SELECT * FROM project ORDER BY \"createdAt\" DESC LIMIT 1'),
  )
  .then((r) => console.log(r.rows))
  .then(() => c.end());
