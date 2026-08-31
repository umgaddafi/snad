<x-mail::message>
# Order Placed Successfully!

Hi **{{ $order->user->name }}**,

Thank you for your order! Your order **#{{ $order->order_number }}** has been successfully placed and is currently being processed.

### Order Details:

<x-mail::table>
| Item       | Quantity         | Price  |
| ------------- |:-------------:| --------:|
@foreach($order->items as $item)
| {{ $item->food->name }} | {{ $item->quantity }}x | ₦{{ number_format($item->unit_price * $item->quantity, 2) }} |
@endforeach
</x-mail::table>

**Delivery Fee:** ₦500.00 <br>
**Total Amount Paid:** ₦{{ number_format($order->total_amount, 2) }}

You can track the live status of your meal using the button below.

<x-mail::button :url="config('app.frontend_url') . '/track'">
Track Order
</x-mail::button>

Thanks,<br>
**Snad Kitchen Team**
</x-mail::message>
