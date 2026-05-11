import { Body, Controller, Ip, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleSignInDto } from './dto/google-signin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  // 가입: 분당 5회/IP — 신규 botspam 방지.
  @Throttle({ auth: { ttl: 60_000, limit: 5 } })
  @Public() @Post('register')
  register(@Body() dto: RegisterDto) { return this.service.register(dto); }

  // 로그인: 분당 5회/IP — credential stuffing 차단.
  @Throttle({ auth: { ttl: 60_000, limit: 5 } })
  @Public() @Post('login')
  login(@Body() dto: LoginDto) { return this.service.login(dto); }

  @Throttle({ auth: { ttl: 60_000, limit: 10 } })
  @Public() @Post('google/id-token')
  googleIdToken(@Body() dto: GoogleSignInDto) { return this.service.signInWithGoogle(dto.idToken); }

  @Throttle({ auth: { ttl: 60_000, limit: 10 } })
  @Public() @Post('refresh')
  refresh(@Body('refreshToken') token: string) { return this.service.refresh(token); }

  @Post('logout')
  logout(@Body('refreshToken') token: string) { return this.service.logout(token); }

  // 비밀번호 재설정 요청 — 응답은 항상 200 (enumeration 방지).
  @Throttle({ auth: { ttl: 60_000, limit: 3 } })
  @Public() @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto, @Ip() ip: string) {
    return this.service.forgotPassword(dto.email, ip);
  }

  @Throttle({ auth: { ttl: 60_000, limit: 5 } })
  @Public() @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(dto.token, dto.password);
  }

  @Throttle({ auth: { ttl: 60_000, limit: 20 } })
  @Public() @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.service.verifyEmail(dto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: { ttl: 60_000, limit: 3 } })
  @Post('resend-verification')
  resendVerification(@CurrentUser('id') id: string) {
    return this.service.resendVerification(id);
  }
}
