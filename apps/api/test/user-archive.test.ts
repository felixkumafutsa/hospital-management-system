jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $transaction: jest.fn(),
  })),
}));

import { PrismaClient } from '@prisma/client';
import { deactivateUser } from '../src/modules/users/users.repository';

const transaction = {
  user: { update: jest.fn() },
  refreshToken: { updateMany: jest.fn() },
};

const prisma = (PrismaClient as jest.Mock).mock.results[0].value as {
  $transaction: jest.Mock;
};

describe('user archive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    );
    transaction.user.update.mockResolvedValue({ id: 'user-1', isActive: false });
    transaction.refreshToken.updateMany.mockResolvedValue({ count: 1 });
  });

  it('deactivates the account and revokes refresh tokens atomically', async () => {
    await expect(deactivateUser('user-1')).resolves.toMatchObject({
      success: true,
      message: 'User archived',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isActive: false },
    });
    expect(transaction.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revoked: false },
      data: { revoked: true },
    });
  });
});
