package com.nhatlam.redditnews.security;

import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RequiresActiveAccountInterceptor implements HandlerInterceptor {

    private final AccountStatusGuard accountStatusGuard;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod) || isSafeMethod(request)) {
            return true;
        }
        if (requiresActiveAccount(handlerMethod)) {
            accountStatusGuard.requireActiveCurrentUser();
        }
        return true;
    }

    private boolean isSafeMethod(HttpServletRequest request) {
        String method = request.getMethod();
        return HttpMethod.GET.matches(method) || HttpMethod.HEAD.matches(method) || HttpMethod.OPTIONS.matches(method);
    }

    private boolean requiresActiveAccount(HandlerMethod handlerMethod) {
        return AnnotatedElementUtils.hasAnnotation(handlerMethod.getMethod(), RequiresActiveAccount.class)
                || AnnotatedElementUtils.hasAnnotation(handlerMethod.getBeanType(), RequiresActiveAccount.class);
    }
}
