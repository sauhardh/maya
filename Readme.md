# 🐱 Maya

> **Cat on-chain · A living pet powered by Solana**

![Maya Banner](./imgs/logo.png)

---

## 🌍 What is Maya?

**Maya is a living, on-chain cat.**

She lives entirely on the Solana blockchain.  
Anyone on the internet can **feed her, play with her, and keep her alive** — together.

If the community stops caring…  
**Maya’s health decays.  
And if neglected long enough, she dies forever.**

This is not a simulation.  
This is a shared responsibility.

---

## ✨ Core Idea

- 🧠 **Single global pet** (not NFTs, not copies)
- ⛓ **On-chain state is the source of truth**
- 🌐 **Anyone can interact**
- 💸 **Feeding costs SOL**
- ⏳ **Time-based decay**
- ☠️ **Permanent death**

> Maya lives only if the world keeps her alive.

---

## 🎮 How It Works

### 🐾 Actions

Anyone can:

- 🍽 **Feed Maya** → increases health & happiness (costs SOL)
- 🧶 **Play with Maya** → increases happiness
- ⏳ **Let time pass** → health & happiness decay automatically

### ⚠️ Decay

- Hunger and happiness decay over time
- Decay is enforced **on-chain**
- If hunger reaches `0`, Maya dies permanently

### 🔥 Community Driven

- Every interaction is public
- Latest feeders are visible
- The chain remembers who cared

---

## 🧱 Architecture

### On-chain (Solana + Anchor)

- Global PDA for Maya
- Time-based decay logic
- SOL escrow inside the pet account
- Owner-only withdrawal
- Emitted events for real-time UI

### Frontend

- Wallet-based interaction (Phantom)
- Real-time account & event subscriptions
- Animated cat (happy, sad, eating, dead)
- Live health & happiness bars
- Feed history & community activity

---

## 🛠 Tech Stack

### Blockchain

- **Solana**
- **Anchor**
- **Rust**

### Frontend

- **Next.js**
- **@coral-xyz/anchor**
- **@solana/wallet-adapter**
- **Three.js / React Three Fiber** (for 3D cat)

---

## 🧪 Development

### localnet

**make sure you are running validator**

```bash
anchor-test-validator --reset
```

### Build program

```bash
anchor build
```

### Deploy program

```bash
anchor Deploy
```

## Frontend

```bash
cd maya/app
```

```bash
npm install && npm run dev
```

**voila! keep your pet alive**

NOTE: In a program, only i can initialize a pet. So, it requires my wallet's public key for initialization.
