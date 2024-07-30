import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
} from "@solana/actions";
import {
  SystemProgram,
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  Keypair,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

import * as anchor from "@coral-xyz/anchor";

import EscrowJson from "@/app/idl/escrow.json";
import { type Escrow } from "@/app/idl/escrow";

export const GET = async (req: Request) => {
  const payload: ActionGetResponse = {
    title: "ZEUS Airdrop",
    icon: new URL(
      "/zeus_network_logo.png",
      new URL(req.url).origin
    ).toString(),
    description:
      "Simple click to claim your ZEUS tokens.",
    label: "Claim $ZEUS",
    links:
    {
      actions: [
        {
          label: "Claim",
          href: "/api/actions/airdrop?password={password}",
          parameters: [
            {
              name: "password",
              label: "Password",
            },
          ],
        }

      ]
    }
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  // const zeusTokenMint = new PublicKey("ZEUS1aR7aX8DFFJf5QjWj2ftDDdNTroMNGo8YoQm3Gq");
  const zeusTokenMint = new PublicKey("BXHy8beuq5D8RpnXpywY21iXB4PaspTUG6TYrRY7LbK2");
  try {
    const body: ActionPostRequest = await req.json();
    // Validate to confirm the user publickey received is valid before use
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return new Response('Invalid "account" provided', {
        status: 400,
        headers: ACTIONS_CORS_HEADERS, //Must include CORS HEADERS
      });
    }

    // const connection = new Connection(clusterApiUrl('mainnet-beta'),{
    //   commitment: "confirmed",
    // });
    const connection = new Connection(clusterApiUrl('devnet'), {
      commitment: "confirmed",
    });
    const program = new anchor.Program<Escrow>(EscrowJson as Escrow, { connection });

    const claimerAtaZeus = await getAssociatedTokenAddress(
      zeusTokenMint,
      account
    );
    // Determined Escrow and Vault addresses
    const params = new URL(req.url).searchParams;
    const password = params.get("password");
    const seed = new anchor.BN(password);
    const escrow = PublicKey.findProgramAddressSync(
      [Buffer.from("state"), seed.toArrayLike(Buffer, "le", 8)],
      program.programId
    )[0];
    const vault = await getAssociatedTokenAddress(
      zeusTokenMint,
      escrow,
      true
    );
    const zeusfrens = PublicKey.findProgramAddressSync(
      [Buffer.from("zeusfrens"), account.toBuffer(), escrow.toBuffer()],
      program.programId
    )[0];
    const accounts = {
      claimer: account,
      mintZeus: zeusTokenMint,
      claimerAtaZeus,
      escrow,
      vault,
      zeusfrens,
      associatedTokenprogram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };
    const airdropInstruction = await program.methods.claim()
      .accounts({ ...accounts, })
      .instruction();


    // Create a transaction and add the transfer instruction
    const transaction = new Transaction().add(airdropInstruction);
    // Set the recent blockhash and fee payer
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    transaction.feePayer = account;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: "Successfully claimed!",
      },
    });

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    console.log(err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return new Response(message, {
      status: 400,
      headers: ACTIONS_CORS_HEADERS, //Must include CORS HEADERS
    });
  }
};

export const runtime = 'edge' // 'nodejs' (default) | 'edge'