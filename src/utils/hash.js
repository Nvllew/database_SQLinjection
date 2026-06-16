import argon2 from 'argon2';

export const hashPassword = async (plain) => {
  return argon2.hash(plain);
};

export const comparePassword = async (plain, hash) => {
  return argon2.verify(hash, plain);
};