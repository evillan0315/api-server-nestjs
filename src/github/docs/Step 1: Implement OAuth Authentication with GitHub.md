## **Step 1: Implement OAuth Authentication with GitHub**

### **1. Set Up a GitHub OAuth App**
To authenticate users, we need to create an OAuth application on GitHub.

#### **Create the OAuth App:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Click **"New OAuth App"**.
3. Fill in the required details:
   - **Application name**: `GitHub API Integration`
   - **Homepage URL**: `http://localhost:3000` (or your production URL later)
   - **Authorization callback URL**: `http://localhost:3000/auth/callback`
4. Click **Register application**.
5. Note down the **Client ID** and **Client Secret** (you’ll use these later).

---

### **2. Set Up a NestJS Project**
Now, let's create the NestJS project.

#### **Install NestJS CLI**
If you don’t have NestJS installed, run:
```sh
npm install -g @nestjs/cli
```

#### **Create a New Project**
```sh
nest new github-api-integration
cd github-api-integration
```
- Select **npm** as the package manager when prompted.

#### **Install Dependencies**
```sh
npm install @nestjs/config passport passport-github2 @nestjs/passport passport-jwt jsonwebtoken
```

---

### **3. Configure GitHub OAuth in NestJS**
#### **Update `src/app.module.ts`**
We need to enable environment variables and import authentication modules.

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule],
})
export class AppModule {}
```

---

### **4. Create Authentication Module**
Run the command:
```sh
nest generate module auth
nest generate service auth
nest generate controller auth
```

---

### **5. Implement OAuth Strategy**
Create the GitHub OAuth strategy in `src/auth/github.strategy.ts`:

```typescript
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GITHUB_CLIENT_ID'),
      clientSecret: configService.get('GITHUB_CLIENT_SECRET'),
      callbackURL: 'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return { accessToken, profile };
  }
}
```

---

### **6. Update Authentication Service**
Modify `src/auth/auth.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async login(user: any) {
    return {
      message: 'GitHub authentication successful!',
      user,
    };
  }
}
```

---

### **7. Add Authentication Controller**
Modify `src/auth/auth.controller.ts`:

```typescript
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    return { message: 'Redirecting to GitHub authentication...' };
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req) {
    return this.authService.login(req.user);
  }
}
```

---

### **8. Add Configuration Variables**
Create a `.env` file at the root of your project:
```sh
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

Also, update `src/main.ts` to load environment variables:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors();
  await app.listen(3000);
  console.log(`Server running on: http://localhost:3000`);
}
bootstrap();
```

---

### **9. Run the Application**
```sh
npm run start:dev
```
- Visit `http://localhost:3000/auth/github` to test authentication.

---

### **Next Steps**
Once this works, we’ll move to **Step 2: Repository Management (Creating, Updating, Deleting Repos).** Let me know if you need help debugging anything! 🌟
