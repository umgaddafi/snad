<!DOCTYPE html>
<html>
<head>
    <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <div style="max-w: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f97316; color: #fff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Snad Kitchen</h1>
            <p style="margin: 0;">Order Confirmed: {{ $order->order_number }}</p>
        </div>
        <div style="padding: 20px;">
            <p>Hi {{ $order->user->name ?? 'Customer' }},</p>
            <p>Your order has been received and is currently <strong>{{ ucfirst($order->status) }}</strong>.</p>
            
            <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Order Summary</h3>
            <ul style="list-style-type: none; padding: 0;">
                @foreach ($order->items as $item)
                    <li style="padding: 5px 0;">
                        {{ $item->quantity }}x {{ $item->food->name ?? 'Item' }} 
                        <span style="float: right;">&#8358;{{ number_format($item->price, 2) }}</span>
                    </li>
                @endforeach
            </ul>
            
            <div style="margin-top: 20px; padding-top: 10px; border-top: 2px solid #eee; font-weight: bold;">
                <p>Total Amount: <span style="float: right;">&#8358;{{ number_format($order->total_amount, 2) }}</span></p>
                <p>Payment Method: <span style="float: right;">{{ ucfirst($order->payment_method ?? 'Cash on Delivery') }}</span></p>
            </div>

            <p style="margin-top: 30px;">Thank you for ordering from Snad Kitchen!</p>
        </div>
    </div>
</body>
</html>
