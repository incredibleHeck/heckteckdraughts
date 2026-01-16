/*
 * Copyright 1996 by Michel D. Grimminck
 *
 * All Rights Reserved
 *
 * Permission to use, copy, modify, and distribute this software and its
 * documentation for any purpose and without fee is hereby granted,
 * provided that the above copyright notice appear in all copies and that
 * both that copyright notice and this permission notice appear in
 * supporting documentation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

#include <stdio.h>
#include "var.h"
#include "functions.h"
#include <string.h>
#include <time.h>
#include <math.h>

#define PN1 1
#define PN2 2
#define PNFIRST 4
#define PNSECOND 8
struct _pn_node {
    int parent;
    int child;
    int right;
    int proof;
    int disproof;
    char color;
    unsigned char board[25];
} *pn,*pn1,*pn2;

int npnn;
int pn_lastnode;
int pn_n; /* global pn-node counter */


void new_pn_node(void)
{
    pn_lastnode=NONE;
}

int add_pn_node(int parent)
{
    pn[npnn].parent=parent;
    pn[npnn].right=NONE;
    pn[npnn].child=NONE;
    if (pn_lastnode!=NONE) pn[pn_lastnode].right=npnn;
    else pn[parent].child=npnn;
    pn_lastnode=npnn;
    npnn++;
    return(npnn-1);
}

int find_node(int color)
{
    int best,child,bestscore,score;
    int orand,node=0;
    if (pn[node].color==color) orand=0; else orand=1;
    do {
        best=-1; bestscore=PN_INF+1;
        child=pn[node].child;
        /*printf("child:%i %i\n",node,child);*/
        if (child==NONE) break;
        do {
            if (orand==0) { /* or node */
                /* select child with smallest proof number */
                score=pn[child].proof;
            }
            else {
                /* select child with smallest disproof number */
                score=pn[child].disproof;
            }
            if (score<bestscore) {bestscore=score; best=child;}
            /*printf("scor:%i %i\n",score,best);*/
            child=pn[child].right;
        } while(child!=NONE);
        node=best; orand^=1;
    } while(true);
    return(node);
}

void update_proof(int node,int orand)
{
    int proof,disproof;
    int parent,child;

    /*printf("update\n");*/
    do {
        if (orand==0) {proof=PN_INF+1; disproof=0;}
        else {proof=0; disproof=PN_INF+1;}
        parent=pn[node].parent;
        child=pn[node].child;
        do {
            if (orand==0) { /* or node */
                /* totalscore is minumum of scores */
                if (pn[child].proof<proof) proof=pn[child].proof;
                disproof+=pn[child].disproof;
            }
            else {
                /* select child with smallest disproof number */
                proof+=pn[child].proof;
                if (pn[child].disproof<disproof) disproof=pn[child].disproof;
            }
            child=pn[child].right;
        } while(child!=NONE);
        pn[node].proof=proof;
        pn[node].disproof=disproof;
        node=parent;
        orand^=1;
        if (parent==NONE) break; /* root */
    } while(true);
}

int pn_search(int level,int color,int ccol,int try_maxnodes,int target,int minscore,int *pr,int *dispr,int flags)
/* does a pn search to obtain a given target. Inputs: color,maxnodes is
   the maximal number of nodes that may be used (should be less than MAXPN).
   target must be one of WINTHEO,WINHEUR,DRAWTHEO to choose between win or
   draw and the use of heuristics or databases only. Level determens which
   movelist is used. Minscore is the minimal required score if target is
   WINHEUR. Returns one of:
   PN_PROVEN if succesful or PN_DISPROVEN if the target can not be reached
   or PN_UNKNOWN if no value is established. Note the entire search tree
   is in memory.
*/
{
    int node,newnode,nmoves,nr,e,orand;
    int result,maxnodes;
    int diff,i,dummy;
    int temp[5];
    FILE *out;
    if (try_maxnodes<=0) return(UNKNOWN);
    maxnodes=try_maxnodes;

    if ((flags&PNFIRST)!=0) pn=pn1;
    else if ((flags&PNSECOND)!=0) pn=pn2;
else {printf("pn abort!\n"); return(UNKNOWN);}
    /* init root position */
    npnn=0;
    new_pn_node();
    add_pn_node(NONE);
    pn[0].proof=1;
    pn[0].disproof=1;
    pn[0].color=ccol;
    compress_board(pn[0].board,board);

    do {
        node=find_node(color);
        /*for(i=0;i<=npnn;i++) printf("%x %i %i %i %i %i \n",pn,i,pn[i].color,pn[i].proof,pn[i].disproof,pn[i].parent);
        printf("node:%i\n",node);*/
        decompress_board(board,pn[node].board); set_pieces();
        ccol=pn[node].color;
        nmoves=move_list(level,ccol);

        new_pn_node();
        if (pn[node].color==color) orand=0; else orand=1;
        for(nr=0;nr<nmoves;nr++) {
            newnode=add_pn_node(node);
            do_move(movelist[level][nr]);

            if ((flags&PN2)!=0 && (flags&PNFIRST)!=0) {
                int score,dummy;
                char dummymove[32];
                int p,d,ln;
                /* try hash tables */
                dummymove[0]=0;
                score=retreive_hash(ccol^1,&p,&d,&dummy,dummymove);
                if (score!=UNKNOWN) {
                    pn[newnode].proof=p;
                    pn[newnode].disproof=d;
                    goto scip_pnfirst;
                }
                temp[0]=npnn;
                temp[1]=pn_lastnode;
                /*test*/printf("%i %i %i\r ",npnn,pn[0].proof,pn[0].disproof);
                if (npnn%20==0) {
                    out=fopen("/tmp/pnlog","a");
                    fprintf(out,"%i %i %i\n",npnn,pn[0].proof,pn[0].disproof);
                    fclose(out);
                }
                result=pn_search(level+1,color,ccol^1,npnn,target,minscore,&p,&d,PN2|PNSECOND);
#ifdef PNLEARN
                ln=pn_n;
#endif
                npnn=temp[0];
                pn_lastnode=temp[1];
                pn=pn1;
                pn[newnode].proof=p;
                pn[newnode].disproof=d;
                if (p==0 || d==0) { /* we have a proof: store it */
                    /*store_hash(ccol^1,0,p,d,dummymove);*/;
                }
#ifdef PNLEARN
                if (target==WINTHEO && result==PN_PROVEN && color==ccol) {
                    if (material(color)==0 && quiet(ccol^1)==true) {
                        printf("nodes:%i\n",ln);
                        display_board();
                        new_table_entry(MISC,color,PN,WIN,ln,10);
                    }
                }
#endif
                goto scip_pnfirst;
            }
            if (target==WINTHEO) {
                int t;
                e=theoretic(ccol^1); if (ccol==color) e=-e;
                if (e==WIN) result=PN_PROVEN;
                else if (e==DRAW || e==LOSE) result=PN_DISPROVEN;
                else result=UNKNOWN;
                diff=10;
                e=material(ccol^1); if (ccol==color) e=-e;
                if (e>2000) diff=6; /*6*/
                else if (e>300) diff=8; /*8*/
                else if (e<-300) diff=12; /*12*/
                else if (e<-2000) diff=13; /*13*/
                t=pieces[white|man]+pieces[white|crown]+pieces[black|man]+pieces[black|crown];
                if (t==4) diff=7*diff/8;
                /*if (t==4) diff=3*diff/8;
                if (t==5) diff=5*diff/8;
                if (t==6) diff=6*diff/8;*/
            }
            else if (target==DRAWTHEO) {
                e=theoretic(ccol^1); if (ccol==color) e=-e;
                if (e==WIN || e==DRAW) result=PN_PROVEN;
                else if (e==LOSE) result=PN_DISPROVEN;
                else result=UNKNOWN;
                diff=1;
            }
            else if (target==WINHEUR) {
                e=material(ccol^1); if (ccol==color) e=-e;
                e-=minscore;
                if (e>300) {

                    e=alfabeta(-INF,INF,ccol^1,level+1,100,0,&dummy);
                    if (color==ccol) e=-e;
                    e-=minscore;

                }
                if (e>500) result=PN_PROVEN;
                else if (e<-50000) result=PN_DISPROVEN;
                else result=UNKNOWN;
                diff=1;
            }
            if (result==PN_PROVEN) {
                pn[newnode].proof=0;
                pn[newnode].disproof=PN_INF;
            }
            else if (result==PN_DISPROVEN) {
                pn[newnode].proof=PN_INF;
                pn[newnode].disproof=0;
            }
            else {
                pn[newnode].proof=diff;
                pn[newnode].disproof=diff;
            }
scip_pnfirst:
            pn[newnode].color=pn[node].color^1;
            compress_board(pn[newnode].board,board);
            undo_move(movelist[level][nr]);

            if ((orand==0 && result==PN_PROVEN) || (orand==1 && result==PN_DISPROVEN)) break;

        } /* end for move */

        if (nmoves>0) update_proof(node,orand);
        else {
            if(ccol!=color) {
                pn[node].proof=0;
                pn[node].disproof=PN_INF;

            }
            else {
                pn[node].proof=PN_INF;
                pn[node].disproof=0;

            }
            if (pn[pn[node].parent].color==color) orand=0; else orand=1;

            update_proof(pn[node].parent,orand);
        }
    } while(pn[0].proof!=0 && pn[0].disproof!=0 && npnn<maxnodes);
    pn_n+=npnn;
    /* restore board */
    decompress_board(board,pn[0].board);
    set_pieces();
    *pr=pn[0].proof;
    *dispr=pn[0].disproof;
    /* determen score best move */
    if (pn[0].proof==0) return(PN_PROVEN);
    else if (pn[0].disproof==0) return(PN_DISPROVEN);
    return(UNKNOWN);
}


int do_pn_search(int color,int maxnodes,int target,int type)
/* Front end for pn searcher; does a pn search and sets the PV */
{
    int score,nr,child,d,time,minscore,bestnode;
    int pr,dispr;
    unsigned char temp[50];
    int dummy;
    
    minscore=evalboard(color,-INF,INF,&dummy);
    time=clock(); d=0;
    pn_n=0;

    pn1=pn2=NULL;
    if (type==1) {
        pn1=(struct _pn_node *)malloc((maxnodes+100)*sizeof(struct _pn_node));
        if (pn1==NULL) {printf("insufficient memory\n"); return(UNKNOWN);}
        score=pn_search(0,color,color,maxnodes,target,minscore,&pr,&dispr,PN1|PNFIRST);
    }
    else if (type==2) {
        init_hash();
        pn1=(struct _pn_node *)malloc(2*(maxnodes+100)*sizeof(struct _pn_node));
        if (pn1==NULL) {printf("insufficient memory\n"); return(UNKNOWN);}
        pn2=&pn1[maxnodes+100];
        score=pn_search(0,color,color,maxnodes,target,minscore,&pr,&dispr,PN2|PNFIRST);
    }

    printf("time:%.2f  pr:%i  dispr:%i\n",(clock()-time)/100.0F,pr,dispr);

    if (score==PN_PROVEN) {
        nr=0;

        printf("proven in %i nodes!\n",pn_n);
        {
            int node,depth=0;

            if (target==WINTHEO) new_table_entry(MISC,color,PNTWO,WIN,pn_n,10);
            compress_board(temp,board);
            node=0;
            do {
                move_list(MAXPLY-2,color); nr=0;
                child=pn[node].child;
                while (child!=NONE) {
                    if (pn[child].proof==0) {
                        movecopy(PV[0][depth],movelist[MAXPLY-2][nr]);
                        do_move(movelist[MAXPLY-2][nr]);
                        move_list(MAXPLY-1,color^1);
                        if (depth+1<MPV) movecopy(PV[0][depth+1],movelist[MAXPLY-1][0]);                       do_move(movelist[MAXPLY-1][0]);
                        bestnode=child;
                        break;
                    }
                    child=pn[child].right;
                    nr++;
                }
                node=pn[bestnode].child;
                depth+=2;
            } while(node!=NONE && depth<MPV);
        }
        decompress_board(board,temp); set_pieces();
    }
    else if (score==PN_DISPROVEN) {
        printf("disproven in %i nodes!\n",pn_n);
    }
    else printf("score could not be established in %i nodes\n",pn_n);
    free(pn1);
    return(score);
}
