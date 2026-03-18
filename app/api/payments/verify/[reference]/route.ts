export async function GET(
  req: Request,
  { params }: { params: { reference: string } }
) {
  try {
    console.log("NEXT VERIFY ROUTE HIT:", params.reference);

    const backendUrl =
      process.env.BACKEND_URL || "http://localhost:4000";

    console.log("BACKEND URL:", backendUrl);

    const res = await fetch(
      `${backendUrl}/payments/verify/${params.reference}`
    );

    console.log("BACKEND STATUS:", res.status);

    const data = await res.text(); // temporarily use text

    console.log("BACKEND RAW RESPONSE:", data);

    return new Response(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("NEXT VERIFY ERROR:", err);
    return Response.json(
      { error: err.message || "Verify failed" },
      { status: 500 }
    );
  }
}