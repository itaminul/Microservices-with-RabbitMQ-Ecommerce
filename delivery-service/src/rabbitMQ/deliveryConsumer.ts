import amqp, { Connection, Channel } from "amqplib";
import { DeliveryService } from "../service/deliveryService";


export class DeliveryConsumer {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly queue = "order_queue";
  private deliveryService: DeliveryService;

  constructor(deliveryService: DeliveryService) {
    this.deliveryService = deliveryService;
  }

  async initialize(): Promise<void> {
    try {
      this.connection = await amqp.connect("amqp://localhost");
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queue, { durable: true });
      console.log("DeliveryConsumer initialized successfully");
      this.consume();
    } catch (error) {
      console.error("Failed to initialize DeliveryConsumer:", error);
      throw error;
    }
  }

  private async consume(): Promise<void> {
    if (!this.channel) {
      throw new Error("DeliveryConsumer is not initialized");
    }

    this.channel.consume(this.queue, async (msg) => {
      if (msg) {
        try {
          const order = JSON.parse(msg.content.toString());
          await this.deliveryService.processOrder(order.id, order.address);
          this.channel?.ack(msg);
        } catch (error) {
          console.error("Error processing message:", error);
          this.channel?.nack(msg);
        }
      }
    });
  }


  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log("DeliveryConsumer closed successfully");
    } catch (error) {
      console.error("Error closing DeliveryConsumer:", error);
      throw error;
    }
  }
}

export default function Component() {
  return null;
}