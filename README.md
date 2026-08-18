@"
# VeriGov — Blockchain-Based Government ID Verification Platform

VeriGov is a full-stack platform that makes government-issued ID documents tamper-proof and instantly verifiable using blockchain technology. Instead of relying on slow, manual cross-checks between institutions, VeriGov lets any authorized party verify a document's authenticity in seconds — while keeping a complete, admin-auditable trail of every check.

Built for **Smart India Hackathon 2026** under the **Blockchain & Cybersecurity** theme.

---

## The Problem

Verifying government-issued IDs (Aadhaar-style documents, certificates, land records) today typically means manual phone calls, emails, or physical checks between institutions — slow, inconsistent, and still vulnerable to forgery. There's no fast, trustworthy way for a bank, employer, or another government office to confirm a document hasn't been altered.

## The Solution

VeriGov stores a cryptographic fingerprint (SHA-256 hash) of each document on a public blockchain — never the document itself. Any change to the original document, even a single altered character, produces a completely different hash, making forgery mathematically detectable.

- **Issuers** (government authorities) register official documents on-chain
- **Verifiers** (banks, employers, other institutions) upload a document and get an instant genuine / tampered result
- **Admins** get a full audit trail of who checked what, and when

---

## Key Features

- Blockchain-backed integrity — document hashes stored immutably on the Ethereum Sepolia testnet via a custom Solidity smart contract
- Role-based access — Admin, User, Student, and Company roles, with self-serve signup and secret-gated admin provisioning
- Real file verification — upload actual PDF/image documents; the system hashes and checks file contents directly
- Admin audit history — every registration and verification attempt is logged with user, role, action, and timestamp
- Secure authentication — JWT-based sessions, bcrypt password hashing
- Persistent, production-style data layer — Turso (distributed SQLite) for user data and audit logs, so nothing resets between server restarts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity, Hardhat |
| Blockchain Network | Ethereum Sepolia (testnet) |
| Backend | Node.js, Express |
| Database | Turso (distributed SQLite) |
| Auth | JWT, bcrypt |
| Frontend | HTML, CSS, JavaScript |
| Blockchain SDK | Ethers.js |

---

## How It Works

1. **Registration**: An authorized issuer uploads a document. The backend computes its SHA-256 hash and writes it to the DocumentVerification smart contract on Sepolia.
2. **Verification**: Anyone can upload a document to check it. The backend re-computes the hash and queries the blockchain — an exact match confirms authenticity; any mismatch flags it as not found or altered.
3. **Audit trail**: Every action (register or verify) is logged to the database with the acting user's email, role, the document hash, and a timestamp — visible to admins on a dedicated history page.

---

## Smart Contract

The DocumentVerification.sol contract exposes:
- registerDocument(bytes32 docHash) — restricted to authorized issuer addresses
- verifyDocument(bytes32 docHash) — public, returns validity, issuer address, and registration timestamp
- authorizeIssuer(address issuer) — admin-only, grants issuer rights to new addresses

Deployed contract (Sepolia testnet): 0xf82e1195ac6FAEF158e2170DBF2fc522f1BBbf2c

Live app: https://verigov.onrender.com/

---

## Future Scope

- Multi-issuer support for different government departments, each with scoped permissions
- QR-code generation for physical documents, linking directly to their on-chain verification record
- Migration path to a permissioned network (e.g. Hyperledger Fabric) for full production deployment
- Mobile app for on-the-spot verification

---

## Team

Built by Team BlockShield for Smart India Hackathon 2026.

