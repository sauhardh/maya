This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configuration

To use your own Anchor program and authorize your own wallet as the owner:

### 1. Frontend Configuration
Copy `.env.local.example` to `.env.local` and update the following:
```bash
NEXT_PUBLIC_PROGRAM_ID=YourProgramID
NEXT_PUBLIC_OWNER_KEY=YourOwnerPublicKey
```
Changes in `app/app/constants.ts` will automatically reflect these values.

### 2. Anchor Program Configuration
1.  **Authorization**: In `programs/maya/src/constants.rs`, update the `OWNER`:
    ```rust
    pub const OWNER: Pubkey = pubkey!("YourOwnerPublicKey");
    ```
2.  **Program Identity**: In `programs/maya/src/lib.rs`, update the `declare_id!`:
    ```rust
    declare_id!("YourNewProgramID");
    ```
    *Don't forget to also update `Anchor.toml` with the same ID!*

## Getting Started

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
