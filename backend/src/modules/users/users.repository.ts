import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: any) { return this.prisma.user.create({ data }); }
  findById(id: string) { return this.prisma.user.findUnique({ where: { id } }); }
  findByEmail(email: string) { return this.prisma.user.findUnique({ where: { email } }); }
  update(id: string, data: any) { return this.prisma.user.update({ where: { id }, data }); }
}
