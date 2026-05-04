export async function GET(
  req: Request,
  { params }: { params: { reference: string } }
) {
  try {
    console.log("NEXT VERIFY ROUTE HIT:", params.reference);

    const backendUrl =
      process.env.BACKEND_URL || "https://brickcell-production.up.railway.app";

    console.log("BACKEND URL:", backendUrl);

    const cookie = req.headers.get("cookie");

    const res = await fetch(
      `${backendUrl}/payments/verify/${params.reference}`,
      {
        method: "GET",
        headers: {
          cookie: cookie || "", 
        },
      }
    );

    console.log("BACKEND STATUS:", res.status);

    const data = await res.json().catch(() => ({}));

    //const data = await res.text(); // temporarily use text

    console.log("BACKEND RAW RESPONSE:", data);

    return Response.json(data, { status: res.status });

    // return new Response(data, {
    //   status: res.status,
    //   headers: { "Content-Type": "application/json" },
    // });

  } catch (err: any) {
    console.error("NEXT VERIFY ERROR:", err);
    return Response.json(
      { error: err.message || "Verify failed" },
      { status: 500 }
    );
  }
}