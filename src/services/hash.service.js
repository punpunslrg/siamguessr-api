import argon2 from "argon2"

const hashService = {}

hashService.hash = (password) => {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2**17,
    timeCost:8
  })
}

hashService.comparePassword = (password,hash) => {
  return argon2.verify(hash,password)
}

export default hashService