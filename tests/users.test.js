const request = require('supertest');
const app = require('../app');

it('POST /users/signup real account', async () => {
  const res = await request(app).post('/users/signup').send({
    email: 'Popopopo@gmail.com',
    password: 'popopopo'
  });
  expect(res.body.result).toBe(true);
})

it('POST /users/signup false account', async () => {
  const res = await request(app).post('/users/signup').send({
    email: 'Popopopo@gmail.com',
    password: 'popopopa'
  });
  expect(res.body.result).toBe(false);
})

it('POST /users/signup not an email', async () => {
  const res = await request(app).post('/users/signup').send({
    email: 'Popopopo.gmail.com',
    password: 'popopopa'
  });
  expect(res.body.result).toBe(false);
})

it('POST /users/signup not a password', async () => {
  const res = await request(app).post('/users/signup').send({
    email: 'Popopopo@gmil.com',
    password: 'popopop'
  });
  expect(res.body.result).toBe(false);
})
