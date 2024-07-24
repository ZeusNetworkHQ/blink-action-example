import {
    ActionPostResponse,
    ACTIONS_CORS_HEADERS,
    createPostResponse,
    ActionGetResponse,
    ActionPostRequest,
  } from "@solana/actions";
  import {
    clusterApiUrl,
    Connection,
    PublicKey,
    Transaction,
    Keypair,
  } from "@solana/web3.js";
  import { getAssociatedTokenAddress, createTransferInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
  import bs58 from "bs58";

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
            href: "/api/actions/airdrop",
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
    const zuesTokenMint = new PublicKey("ZEUS1aR7aX8DFFJf5QjWj2ftDDdNTroMNGo8YoQm3Gq");

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

      const connection = new Connection(clusterApiUrl('mainnet-beta'),{
        commitment: "confirmed",
      });
      const mainWalletPrivateKey = bs58.decode(process.env['MAIN_WALLET_PRIVATE_KEY'] ?? '');
      const mainWallet = Keypair.fromSecretKey(
        new Uint8Array(mainWalletPrivateKey)
      );
    
      // Get the token account of the main wallet
      const fromTokenAccount = await getAssociatedTokenAddress(
        zuesTokenMint,
        mainWallet.publicKey
      );
    
      let toTokenAccount;
      // Get the token account of the customer wallet
      toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        mainWallet,
        zuesTokenMint,
        account
      );
      console.log('Receiver token account:', toTokenAccount.address.toBase58());
    
      // Create the transfer instruction
      const transferInstruction = createTransferInstruction(
        fromTokenAccount,
        toTokenAccount.address,
        mainWallet.publicKey,
        1
      );
    
      // Create a transaction and add the transfer instruction
      const transaction = new Transaction().add(transferInstruction);
    
      // Set the recent blockhash and fee payer
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = mainWallet.publicKey;
  
      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          transaction,
          message: "Post this memo on-chain",
        },
        // no additional signers are required for this transaction
        // signers: [],
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