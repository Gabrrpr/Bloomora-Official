export type DeliveryTaskStatus = 'ready_for_pickup' | 'picked_up' | 'on_the_way' | 'arrived' | 'completed';

export type DeliveryTask = {
  address: string;
  completionTime?: string;
  customerNotes: string;
  deliverBefore: string;
  id: string;
  item: {
    handling: string[];
    image: string;
    name: string;
    quantity: number;
  };
  orderNumber: string;
  phoneNumber: string;
  recipientName: string;
  status: DeliveryTaskStatus;
};

export const deliveryTasks: DeliveryTask[] = [
  {
    address: 'San Fernando, Pampanga - near Capitol Boulevard',
    customerNotes: 'Recipient is available after lunch.',
    deliverBefore: '2:00 PM',
    id: 'preview-delivery-001',
    item: {
      handling: ['Keep bouquet upright', 'Avoid direct sunlight'],
      image: 'pink-rose-bouquet',
      name: 'Pink Rose Bouquet',
      quantity: 1,
    },
    orderNumber: 'EST-1042',
    phoneNumber: '09171234567',
    recipientName: 'Angela Reyes',
    status: 'ready_for_pickup',
  },
  {
    address: 'Angeles City, Pampanga - Friendship Highway',
    customerNotes: 'Deliver to the front desk if the recipient is in a meeting.',
    deliverBefore: '3:15 PM',
    id: 'preview-delivery-002',
    item: {
      handling: ['Keep bouquet upright', 'Do not place under heavy items'],
      image: 'sunflower-wrap',
      name: 'Sunflower Wrap',
      quantity: 1,
    },
    orderNumber: 'EST-1043',
    phoneNumber: '09181234567',
    recipientName: 'Marco Santos',
    status: 'ready_for_pickup',
  },
  {
    address: 'Mabalacat, Pampanga - Dau terminal area',
    customerNotes: 'Sympathy flowers. Keep handoff quiet and respectful.',
    deliverBefore: '4:00 PM',
    id: 'preview-delivery-003',
    item: {
      handling: ['Keep arrangement cool', 'Do not tilt arrangement'],
      image: 'white-sympathy-basket',
      name: 'White Sympathy Basket',
      quantity: 1,
    },
    orderNumber: 'EST-1044',
    phoneNumber: '09191234567',
    recipientName: 'Carmela Dizon',
    status: 'ready_for_pickup',
  },
];

export function getDeliveryTask(id: string) {
  return deliveryTasks.find((task) => task.id === id) ?? deliveryTasks[0];
}

export function getStatusLabel(status: DeliveryTaskStatus) {
  const labels: Record<DeliveryTaskStatus, string> = {
    arrived: 'Arrived',
    completed: 'Delivered',
    on_the_way: 'On The Way',
    picked_up: 'Picked Up',
    ready_for_pickup: 'Ready for Pickup',
  };

  return labels[status];
}
