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
    address: '067 Sampaloc, Manila',
    customerNotes: 'Surprise delivery. Do not call recipient before arrival.',
    deliverBefore: '2:00 PM',
    id: '1024',
    item: {
      handling: ['Keep bouquet upright', 'Avoid direct sunlight'],
      image: 'birthday-bouquet',
      name: 'Birthday Bouquet',
      quantity: 1,
    },
    orderNumber: '1024',
    phoneNumber: '09123456789',
    recipientName: 'Maria Santos',
    status: 'ready_for_pickup',
  },
  {
    address: 'Malolos, Bulacan',
    customerNotes: 'Call the admin contact only if the recipient is unavailable.',
    deliverBefore: '4:30 PM',
    id: '1025',
    item: {
      handling: ['Keep bouquet upright', 'Do not place under heavy items'],
      image: 'sunflower-wrap',
      name: 'Sunflower Wrap',
      quantity: 1,
    },
    orderNumber: '1025',
    phoneNumber: '09170001234',
    recipientName: 'Aileen Cruz',
    status: 'picked_up',
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
