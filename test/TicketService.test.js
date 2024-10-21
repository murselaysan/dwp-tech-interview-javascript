import TicketService from '../src/pairtest/TicketService.js';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js';
import TicketPaymentService from '../src/thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../src/thirdparty/seatbooking/SeatReservationService.js';

// Mock the external services
jest.mock('../src/thirdparty/paymentgateway/TicketPaymentService.js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      makePayment: jest.fn(),
    };
  });
});

jest.mock('../src/thirdparty/seatbooking/SeatReservationService.js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      reserveSeat: jest.fn(),
    };
  });
});

describe('TicketService', () => {
  let paymentServiceMock;
  let seatReservationServiceMock;
  let ticketService;

  beforeEach(() => {
    paymentServiceMock = new TicketPaymentService();
    seatReservationServiceMock = new SeatReservationService();

    // Inject the mocked services
    ticketService = new TicketService(paymentServiceMock, seatReservationServiceMock);
  });

  test('should throw InvalidPurchaseException when no adult ticket is purchased with child or infant tickets', () => {
    const childTicketRequest = new TicketTypeRequest('CHILD', 2);
    const infantTicketRequest = new TicketTypeRequest('INFANT', 1);

    expect(() => {
      ticketService.purchaseTickets(1, childTicketRequest, infantTicketRequest);
    }).toThrow(InvalidPurchaseException);
  });

  test('should throw InvalidPurchaseException when more than 25 tickets are purchased', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 26);

    expect(() => {
      ticketService.purchaseTickets(1, adultTicketRequest);
    }).toThrow(InvalidPurchaseException);
  });

  test('should calculate the correct total price and reserve correct number of seats', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 2);
    const childTicketRequest = new TicketTypeRequest('CHILD', 1);

    ticketService.purchaseTickets(1, adultTicketRequest, childTicketRequest);

    expect(paymentServiceMock.makePayment).toHaveBeenCalledWith(1, 65); // (2 Adults * £25 + 1 Child * £15)
    expect(seatReservationServiceMock.reserveSeat).toHaveBeenCalledWith(1, 3); // 2 Adults + 1 Child
  });

  test('should handle purchase of only adult tickets', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 3);

    ticketService.purchaseTickets(1, adultTicketRequest);

    expect(paymentServiceMock.makePayment).toHaveBeenCalledWith(1, 75); // 3 Adults * £25
    expect(seatReservationServiceMock.reserveSeat).toHaveBeenCalledWith(1, 3); // 3 Adults
  });

  test('should handle purchase of adult, child, and infant tickets (infant does not reserve seat)', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 2);
    const childTicketRequest = new TicketTypeRequest('CHILD', 1);
    const infantTicketRequest = new TicketTypeRequest('INFANT', 2);

    ticketService.purchaseTickets(1, adultTicketRequest, childTicketRequest, infantTicketRequest);

    expect(paymentServiceMock.makePayment).toHaveBeenCalledWith(1, 65); // 2 Adults * £25 + 1 Child * £15
    expect(seatReservationServiceMock.reserveSeat).toHaveBeenCalledWith(1, 3); // 2 Adults + 1 Child (Infants don’t get seats)
  });
});
