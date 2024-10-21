import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';

export default class TicketService {
  constructor(paymentService = null, seatService = null) {
    this.paymentService = paymentService;
    this.seatService = seatService;
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    if (accountId <= 0) {
      throw new InvalidPurchaseException('Invalid account ID.');
    }

    let totalTickets = 0;
    let totalAmount = 0;
    let totalSeats = 0;
    let hasAdultTicket = false;

    ticketTypeRequests.forEach((request) => {
      const ticketType = request.getTicketType(); // Use getter method
      const noOfTickets = request.getNoOfTickets(); // Use getter method

      switch (ticketType) {
        case 'ADULT':
          totalAmount += noOfTickets * 25;
          totalSeats += noOfTickets;
          hasAdultTicket = true;
          break;
        case 'CHILD':
          totalAmount += noOfTickets * 15;
          totalSeats += noOfTickets;
          break;
        case 'INFANT':
          break;
        default:
          throw new InvalidPurchaseException('Invalid ticket type.');
      }

      totalTickets += noOfTickets;
    });

    if (!hasAdultTicket) {
      throw new InvalidPurchaseException('At least one Adult ticket must be purchased with Child or Infant tickets.');
    }

    if (totalTickets > 25) {
      throw new InvalidPurchaseException('Cannot purchase more than 25 tickets in a single transaction.');
    }

    this.paymentService.makePayment(accountId, totalAmount); // Use injected service
    this.seatService.reserveSeat(accountId, totalSeats); // Use injected service
  }
}

