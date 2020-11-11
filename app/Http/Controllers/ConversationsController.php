<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMessageRequest;
use App\Notifications\MessageReceived;
use App\Repository\ConversationRepository;
use App\User;
use Illuminate\Auth\AuthManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ConversationsController extends Controller
{
    /**
     * @var ConversationRepository
     */
    private $r;
    /**
     * @var AuthManager
     */
    private $auth;

    public function __construct(ConversationRepository $r, AuthManager $auth)
    {
        $this->r = $r;
        $this->auth = $auth;
        $this->middleware('auth');
    }

    public function index()
    {
        return view('conversations.index');
    }

    public function show(User $user)
    {
        $me = $this->auth->user()->id;
        $message = $this->r->getMessagesFor($me, $user->id)->paginate(10);
        $unread = $this->r->unreadMessage($me);

        if (isset($unread[$user->id]))
        {
            $this->r->readAllFrom($user->id, $me);
            unset($unread[$user->id]);
        }

        $users = User::select('name', 'id')->where('id', '!=', Auth::user()->id)->get();
        return view('conversations.show', [
            'user' => $user,
            'users' => $this->r->getConversation($me),
            'messages' => $message,
            'unread' => $unread
        ]);
    }

    public function store(User $user, StoreMessageRequest $request)
    {
        $message = $this->r->createMessage(
            $request->get('content'),
            $this->auth->user()->id,
            $user->id
        );
        $user->notify(new MessageReceived($message));
        return redirect(route('conversations.show', ['id' => $user->id]));
    }

}
