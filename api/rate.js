export default async function handler(req, res) {
  try {
    const { from = "EUR", to } = req.query;

    if (!to) {
      return res.status(400).json({ error: "Missing 'to' currency" });
    }

    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Frankfurter API error: ${response.status}`,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}