<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMessageRequest;
use App\Repository\ConversationRepository;
use App\User;
use Illuminate\Http\Request;

class ConversationController extends Controller {

    /**
     * @var ConversationRepository
     */
    private $r;

    public function __construct(ConversationRepository $r)
    {
        $this->r = $r;
    }

    public function index(Request $request)
    {
        return [
                'conversations' => $this->r->getConversation($request->user()->id)
            ];
    }

    public function show(Request $request, User $user)
    {
        $messages = $this->r
            ->getMessagesFor($request->user()->id, $user->id);
        if ($request->get('before')){
            $messages = $messages->where('created_at', '<', $request->get('before'));
        }
        return [
            'messages' => array_reverse($messages->limit(10)->get()->toArray()),
            'count' => $request->get('before') ? '' : $messages->count()
        ];
    }

    public function store(User $user, StoreMessageRequest $request)
    {
        $message = $this->r->createMessage(
            $request->get('content'),
            $request->user()->id,
            $user->id
        );
        return [
          'message' => $message
        ];
    }
}
