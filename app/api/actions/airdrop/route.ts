import {
    ActionPostResponse,
    ACTIONS_CORS_HEADERS,
    createPostResponse,
    MEMO_PROGRAM_ID,
    ActionGetResponse,
    ActionPostRequest,
  } from "@solana/actions";
  import {
    clusterApiUrl,
    ComputeBudgetProgram,
    Connection,
    PublicKey,
    Transaction,
    TransactionInstruction,
  } from "@solana/web3.js";

  export const GET = async (req: Request) => {
    const payload: ActionGetResponse = {
      title: "ZEUS Airdrop",
      icon: new URL(
        "/public/zeus_network_logo.png",
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
      const transaction = new Transaction()
  
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