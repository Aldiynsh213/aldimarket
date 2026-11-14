// Usage: node scripts/create-owner.js <username> <email> <password>
const bcrypt = require('bcryptjs');
const { readData, writeData, generateId } = require('../api/data-store');

(async () => {
  const [username, email, password] = process.argv.slice(2);
  if (!username || !email || !password || password.length < 8) {
    console.error('Usage: node scripts/create-owner.js <username> <email> <password(min 8)>');
    process.exit(1);
  }
  const data = await readData();
  if (data.users.some((u) => u.username === username)) {
    console.error('Username sudah ada.');
    process.exit(1);
  }
  data.users.push({
    id: generateId('USR'), username, name: username, email, phone: '', phoneNormalized: '',
    role: 'owner', passwordHash: await bcrypt.hash(password, 10), createdAt: new Date().toISOString(),
  });
  await writeData(data);
  console.log('Owner dibuat:', username);
})();
