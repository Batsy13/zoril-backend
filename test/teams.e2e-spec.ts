import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('TeamsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let adminId: number;
  let memberToken: string;
  let memberId: number;
  let memberEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const adminEmail = `admin${Date.now()}@example.com`;
    const password = 'password123';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Admin User', email: adminEmail, password })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(201);
    adminToken = loginResponse.body.access_token;

    memberEmail = `member${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Member User', email: memberEmail, password })
      .expect(201);

    const memberLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: memberEmail, password })
      .expect(201);
    memberToken = memberLoginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  let teamId: number;
  let inviteId: number;

  it('/teams (POST) - should create a team', async () => {
    const response = await request(app.getHttpServer())
      .post('/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dream Team' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toEqual('Dream Team');
    teamId = response.body.id;
  });

  it('/teams/:id/invite (POST) - should invite user', async () => {
    const response = await request(app.getHttpServer())
      .post(`/teams/${teamId}/invite`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: memberEmail })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toEqual('PENDING');
    inviteId = response.body.id;
  });

  it('/teams/invites/:id/accept (POST) - should accept invitation', async () => {
    const response = await request(app.getHttpServer())
      .post(`/teams/invites/${inviteId}/accept`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(201);

    expect(response.body.status).toEqual('ACCEPTED');
  });

  let taskId: number;

  it('/tasks (POST) - should create task for team', async () => {
    const taskData = {
      title: 'Team Task',
      description: 'Do it together',
      teamId: teamId,
    };

    const response = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(taskData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.team).toBeDefined();
    expect(response.body.team.id).toEqual(teamId);
    taskId = response.body.id;
  });

  it('/teams/:id/tasks (GET) - member should see team tasks', async () => {
    const response = await request(app.getHttpServer())
      .get(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].id).toEqual(taskId);
  });

  it('/teams/:teamId/members/:memberId (DELETE) - admin should remove member', async () => {
    await request(app.getHttpServer())
      .delete(`/teams/${teamId}/members/${inviteId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('/teams/:id/tasks (GET) - member should NOT see team tasks after removal', async () => {
    await request(app.getHttpServer())
      .get(`/teams/${teamId}/tasks`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });
});
