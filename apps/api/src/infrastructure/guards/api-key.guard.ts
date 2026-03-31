import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalApiGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Allow requests from localhost (Next.js internal calls)
    const host = request.ip || request.connection?.remoteAddress || '';
    const isLocalhost = host === '127.0.0.1' || host === '::1' || host === '::ffff:127.0.0.1' || host === 'localhost';

    if (isLocalhost) return true;

    // For external requests, require API secret header
    const secret = process.env.INTERNAL_API_SECRET;
    if (!secret) return true; // No secret configured = allow (dev mode)

    const provided = request.headers['x-internal-secret'];
    if (provided === secret) return true;

    throw new UnauthorizedException('Acesso não autorizado à API interna');
  }
}
