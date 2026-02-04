import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const randomEmail = `test${Date.now()}@example.com`;
    const password = 'password123';

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Test User', email: randomEmail, password })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: randomEmail, password })
      .expect(201);

    jwtToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  const taskData = {
    title: 'Test Task',
    description: 'A test task',
    status: 'IN_PROGRESS',
  };

  let taskId: number;

  it('/tasks (POST) - should create a task', async () => {
    const response = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(taskData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toEqual(taskData.title);
    expect(response.body).toHaveProperty('responsible');
    expect(response.body.responsible.id).toBeDefined();

    taskId = response.body.id;
  });

  it('/tasks (POST) - should fail without auth', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .send(taskData)
      .expect(401);
  });

  it('/tasks (GET) - should list tasks', async () => {
    const response = await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('/tasks/:id (GET) - should get a task', async () => {
    const response = await request(app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(response.body.id).toEqual(taskId);
  });

  it('/tasks/:id (PATCH) - should update a task', async () => {
    const updateData = { title: 'Updated Title' };
    const response = await request(app.getHttpServer())
      .patch(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body.title).toEqual('Updated Title');
  });

  it('/tasks/:id/comments (POST) - should add a comment', async () => {
    const commentData = { content: 'Test Comment' };
    const response = await request(app.getHttpServer())
      .post(`/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(commentData)
      .expect(201);

    expect(response.body.content).toEqual(commentData.content);
    expect(response.body.author).toBeDefined();
  });
});
