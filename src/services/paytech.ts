interface PayTechOptions {
  amount: number;
  itemName: string;
  refCommand: string;
}

/**
 * Initializes a PayTech payment transaction and redirects the user.
 */
export const initializePayTechPayment = async (options: PayTechOptions): Promise<boolean> => {
  const successUrl = `${window.location.origin}/?paytech_success=true&ref=${options.refCommand}&amount=${options.amount}`;
  const cancelUrl = `${window.location.origin}/?paytech_cancel=true`;

  try {
    const response = await fetch('/api/paytech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: options.amount,
        itemName: options.itemName,
        refCommand: options.refCommand,
        successUrl,
        cancelUrl
      })
    });

    const data = await response.json();

    if (data.success && data.redirect_url) {
      // Redirect the user to the PayTech checkout page
      window.location.href = data.redirect_url;
      return true;
    } else {
      console.error('PayTech initialization failed:', data.error);
      alert(`Erreur d'initialisation du paiement PayTech : ${data.error || 'Veuillez réessayer'}`);
      return false;
    }
  } catch (error) {
    console.error('PayTech payment service error:', error);
    alert("Impossible d'établir la connexion avec la passerelle PayTech. Veuillez réessayer.");
    return false;
  }
};
